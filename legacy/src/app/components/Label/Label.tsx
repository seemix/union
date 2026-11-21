import React from 'react';

import './Label.css';

const Label = ({ text = '', size = 'small', color = 'red' }: { text: string, size: string, color: string }) => {
    return (
        <div
            className={'label' + (size === 'small' ? ' small_text' : ' big_text') + (color === 'red' ? ' background_red' : ' background_green')}>
            {text}
        </div>
    );
};

export default Label;