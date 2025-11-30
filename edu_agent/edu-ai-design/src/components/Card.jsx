const Card = ({ children, className = '', variant = 'default', hover = false }) => {
    const variants = {
        default: 'bg-white border border-gray-200',
        glass: 'glass',
        gradient: 'gradient-primary text-white',
    };

    return (
        <div
            className={`rounded-2xl p-6 ${variants[variant]} ${hover ? 'card-hover' : ''
                } ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
