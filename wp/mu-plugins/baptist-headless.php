<?php
/**
 * Plugin Name: Baptist Headless
 * Description: Union v2 headless support: protected views counter (WP-PostViews compatible), on-demand revalidation of the Next.js frontend, `app-thumb` image size.
 * Version:     1.0.0
 * Requires PHP: 7.4
 *
 * Must-use plugin: copy to wp-content/mu-plugins/baptist-headless.php (same file on ru and ro).
 * Configuration lives in wp-config.php, see wp/README.md:
 *
 *   UNION_VIEWS_SECRET       secret for POST /wp-json/baptist/v1/views/{id}; undefined/empty → route not registered
 *   UNION_SITE               'ru' | 'ro', sent to the frontend with every revalidation
 *   UNION_FRONTEND_URL       e.g. 'https://ru.baptist.org.md' (several: comma-separated, e.g. prod + staging)
 *   UNION_REVALIDATE_SECRET  secret for {frontend}/api/revalidate; any of the three undefined/empty → hooks off
 *   UNION_APP_THUMB_WIDTH,
 *   UNION_APP_THUMB_HEIGHT,
 *   UNION_APP_THUMB_CROP     optional `app-thumb` size; not registered unless width and height are set
 *
 * WP-PostViews stays active: it exposes `views` in REST. This plugin only increments the same meta key.
 */

defined('ABSPATH') || exit;

/* -------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------- */

/**
 * Non-empty string value of a wp-config constant, or '' when undefined/empty.
 */
function baptist_headless_const(string $name): string
{
    if (!defined($name)) {
        return '';
    }
    $value = constant($name);
    return is_string($value) ? trim($value) : '';
}

/* -------------------------------------------------------------------------
 * 1. Views counter: POST /wp-json/baptist/v1/views/{id}
 * ---------------------------------------------------------------------- */

add_action('rest_api_init', 'baptist_headless_register_views_route');

function baptist_headless_register_views_route(): void
{
    // No secret configured → the route does not exist (404 rest_no_route).
    if (baptist_headless_const('UNION_VIEWS_SECRET') === '') {
        return;
    }

    register_rest_route('baptist/v1', '/views/(?P<id>\d+)', array(
        'methods'             => 'POST',
        'callback'            => 'baptist_headless_increment_views',
        'permission_callback' => 'baptist_headless_check_views_secret',
        'args'                => array(
            'id' => array(
                'required'          => true,
                'validate_callback' => static function ($value) {
                    return is_numeric($value) && (int) $value > 0 && (string) (int) $value === (string) $value;
                },
                'sanitize_callback' => 'absint',
            ),
        ),
    ));
}

/**
 * @return true|WP_Error
 */
function baptist_headless_check_views_secret(WP_REST_Request $request)
{
    $secret   = baptist_headless_const('UNION_VIEWS_SECRET');
    $provided = $request->get_header('x_union_secret');

    if ($secret === '' || !is_string($provided) || $provided === '' || !hash_equals($secret, $provided)) {
        return new WP_Error('baptist_unauthorized', 'Unauthorized.', array('status' => 401));
    }
    return true;
}

/**
 * @return WP_REST_Response|WP_Error
 */
function baptist_headless_increment_views(WP_REST_Request $request)
{
    global $wpdb;

    $id   = (int) $request['id'];
    $post = $id > 0 ? get_post($id) : null;

    if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
        return new WP_Error('baptist_not_found', 'Post not found.', array('status' => 404));
    }

    // Atomic increment of the WP-PostViews key. ORDER BY/LIMIT: if duplicate rows exist,
    // touch only the first one — the one get_post_meta($id, 'views', true) returns.
    $sql_update = $wpdb->prepare(
        "UPDATE {$wpdb->postmeta}
            SET meta_value = CAST(meta_value AS UNSIGNED) + 1
          WHERE post_id = %d AND meta_key = 'views'
          ORDER BY meta_id ASC
          LIMIT 1",
        $id
    );

    $updated = $wpdb->query($sql_update);

    if ($updated === false) {
        return new WP_Error('baptist_db_error', 'Could not update views.', array('status' => 500));
    }

    if ($updated === 0) {
        // No meta yet. `unique` = true: if a parallel request created it first, add fails → retry the UPDATE.
        if (!add_post_meta($id, 'views', 1, true)) {
            $wpdb->query($sql_update);
        }
    }

    // Our raw SQL bypassed the meta cache — drop it so REST/WP-PostViews read the fresh value.
    wp_cache_delete($id, 'post_meta');

    $views = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT meta_value FROM {$wpdb->postmeta}
          WHERE post_id = %d AND meta_key = 'views'
          ORDER BY meta_id ASC
          LIMIT 1",
        $id
    ));

    $response = new WP_REST_Response(array('id' => $id, 'views' => $views), 200);
    $response->header('Cache-Control', 'no-store');
    return $response;
}

/* -------------------------------------------------------------------------
 * 2. On-demand revalidation → POST {UNION_FRONTEND_URL}/api/revalidate
 *
 * Body (JSON): {"site":"ru","type":"post|page|category|menu","id":123,"slug":"…","action":"…"}
 * Header:      X-Union-Secret: UNION_REVALIDATE_SECRET
 *
 * Events are collected during the request, de-duplicated (one save fires several hooks)
 * and sent once on `shutdown`, after the response has been flushed to the editor.
 * ---------------------------------------------------------------------- */

/** Post types the frontend renders. */
const BAPTIST_HEADLESS_POST_TYPES = array('post', 'page');

/** @var array<string, array<string, mixed>> */
$GLOBALS['baptist_headless_queue'] = array();

function baptist_headless_revalidation_enabled(): bool
{
    return baptist_headless_const('UNION_FRONTEND_URL') !== ''
        && baptist_headless_const('UNION_REVALIDATE_SECRET') !== ''
        && baptist_headless_const('UNION_SITE') !== '';
}

function baptist_headless_queue(string $type, int $id, string $slug, string $action): void
{
    if (!baptist_headless_revalidation_enabled()) {
        return;
    }
    // Same entity twice in one request → the last action wins.
    $GLOBALS['baptist_headless_queue'][$type . ':' . $id] = array(
        'site'   => baptist_headless_const('UNION_SITE'),
        'type'   => $type,
        'id'     => $id,
        'slug'   => $slug,
        'action' => $action,
    );
}

/**
 * Skip autosaves, revisions and post types the frontend does not show.
 *
 * @param WP_Post $post
 */
function baptist_headless_is_relevant_post($post): bool
{
    if (!($post instanceof WP_Post)) {
        return false;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return false;
    }
    if (wp_is_post_revision($post) || wp_is_post_autosave($post)) {
        return false;
    }
    return in_array($post->post_type, BAPTIST_HEADLESS_POST_TYPES, true);
}

/**
 * Publish, update of a published post, unpublish (draft/private/trash).
 * Draft → draft and similar changes are invisible on the frontend and are ignored.
 */
add_action('transition_post_status', 'baptist_headless_on_transition', 10, 3);

function baptist_headless_on_transition(string $new_status, string $old_status, $post): void
{
    if (!baptist_headless_is_relevant_post($post)) {
        return;
    }
    if ($new_status !== 'publish' && $old_status !== 'publish') {
        return;
    }

    if ($new_status === 'publish') {
        $action = $old_status === 'publish' ? 'update' : 'publish';
    } else {
        $action = 'unpublish';
    }

    baptist_headless_queue($post->post_type, (int) $post->ID, (string) $post->post_name, $action);
}

/**
 * save_post fires after terms and meta are saved (classic editor, quick edit, REST).
 * Covers category changes of an already published post; de-duplicated with the hook above.
 */
add_action('save_post', 'baptist_headless_on_save', 10, 3);

function baptist_headless_on_save(int $post_id, $post, bool $update): void
{
    if (!baptist_headless_is_relevant_post($post) || $post->post_status !== 'publish') {
        return;
    }
    $key = $post->post_type . ':' . $post_id;
    // Keep the more specific action set by transition_post_status ('publish').
    $action = isset($GLOBALS['baptist_headless_queue'][$key])
        ? (string) $GLOBALS['baptist_headless_queue'][$key]['action']
        : 'update';
    baptist_headless_queue($post->post_type, $post_id, (string) $post->post_name, $action);
}

/** Permanent deletion of a still published post (normally it is trashed first → 'unpublish'). */
add_action('before_delete_post', 'baptist_headless_on_delete', 10, 2);

function baptist_headless_on_delete(int $post_id, $post = null): void
{
    $post = $post instanceof WP_Post ? $post : get_post($post_id);
    if (!baptist_headless_is_relevant_post($post) || $post->post_status !== 'publish') {
        return;
    }
    baptist_headless_queue($post->post_type, $post_id, (string) $post->post_name, 'delete');
}

/* Categories: name/slug change or deletion affects category pages and lookups. */
add_action('created_category', 'baptist_headless_on_category_created', 10, 1);
add_action('edited_category', 'baptist_headless_on_category_edited', 10, 1);
add_action('delete_category', 'baptist_headless_on_category_deleted', 10, 3);

function baptist_headless_on_category_created(int $term_id): void
{
    baptist_headless_on_category($term_id, 'publish');
}

function baptist_headless_on_category_edited(int $term_id): void
{
    baptist_headless_on_category($term_id, 'update');
}

/**
 * @param WP_Term|mixed $deleted_term
 */
function baptist_headless_on_category_deleted(int $term_id, int $tt_id, $deleted_term): void
{
    $slug = $deleted_term instanceof WP_Term ? (string) $deleted_term->slug : '';
    baptist_headless_queue('category', $term_id, $slug, 'delete');
}

function baptist_headless_on_category(int $term_id, string $action): void
{
    $term = get_term($term_id, 'category');
    $slug = $term instanceof WP_Term ? (string) $term->slug : '';
    baptist_headless_queue('category', $term_id, $slug, $action);
}

/* Menus: saving a menu, its items or locations, or deleting it. */
add_action('wp_update_nav_menu', 'baptist_headless_on_menu_updated', 10, 1);
add_action('wp_delete_nav_menu', 'baptist_headless_on_menu_deleted', 10, 1);

function baptist_headless_on_menu_updated(int $menu_id): void
{
    baptist_headless_queue('menu', $menu_id, '', 'update');
}

function baptist_headless_on_menu_deleted(int $menu_id): void
{
    baptist_headless_queue('menu', $menu_id, '', 'delete');
}

/* Send everything once, at the end of the request. */
add_action('shutdown', 'baptist_headless_flush_queue', 100);

function baptist_headless_flush_queue(): void
{
    $events = $GLOBALS['baptist_headless_queue'];
    if (empty($events) || !baptist_headless_revalidation_enabled()) {
        return;
    }
    $GLOBALS['baptist_headless_queue'] = array();

    // Let the editor's browser go first: the HTTP calls below must not slow the admin down.
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } elseif (function_exists('litespeed_finish_request')) {
        litespeed_finish_request();
    }

    $secret = baptist_headless_const('UNION_REVALIDATE_SECRET');
    $bases  = array_filter(array_map('trim', explode(',', baptist_headless_const('UNION_FRONTEND_URL'))));

    foreach ($bases as $base) {
        $url = untrailingslashit($base) . '/api/revalidate';
        foreach ($events as $event) {
            // blocking=false: WP does not wait for/parse the answer. The timeout must still be long
            // enough to finish the TLS handshake and send the body — very small values drop the request.
            wp_remote_post($url, array(
                'blocking'  => false,
                'timeout'   => 3,
                'headers'   => array(
                    'Content-Type'   => 'application/json',
                    'X-Union-Secret' => $secret,
                ),
                'body'      => wp_json_encode($event),
                'sslverify' => true,
            ));
        }
    }
}

/* -------------------------------------------------------------------------
 * 3. Image size `app-thumb` (independent of the theme)
 *
 * The theme never registered it: its `fimg_url` calls wp_get_attachment_image_src(…, 'app-thumb'),
 * which for an unknown size returns the original — so the old site always showed full-size images,
 * and none of the ~7,900 attachments on ru/ro (2026-11-21) has an `app-thumb` file.
 * Nothing is registered by default (1:1 = the original `source_url`). Set UNION_APP_THUMB_*
 * only if a real thumbnail size is wanted later.
 * ---------------------------------------------------------------------- */

add_action('after_setup_theme', 'baptist_headless_register_image_size', 20);

function baptist_headless_register_image_size(): void
{
    $width  = defined('UNION_APP_THUMB_WIDTH') ? (int) UNION_APP_THUMB_WIDTH : 0;
    $height = defined('UNION_APP_THUMB_HEIGHT') ? (int) UNION_APP_THUMB_HEIGHT : 0;
    if ($width <= 0 && $height <= 0) {
        return;
    }
    $crop = defined('UNION_APP_THUMB_CROP') ? (bool) UNION_APP_THUMB_CROP : true;
    // Same name as the theme's size: re-registering overrides it, the theme keeps working.
    add_image_size('app-thumb', max(0, $width), max(0, $height), $crop);
}
