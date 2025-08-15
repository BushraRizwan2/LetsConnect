import React from 'react';

const TypingIndicator: React.FC<{ name: string }> = ({ name }) => {
    return (
        <div className="flex items-center space-x-2 text-text-secondary animate-fade-in-fast pl-12">
            <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            <p className="text-sm font-semibold">{name} is typing..</p>
        </div>
    );
};

export default TypingIndicator;