import React from 'react';
import '../styles/global.css';

const Card = (props) => {
    return (
        <div className="card frosted-glass">
            {props.children}
        </div>
    );
};

export default Card;