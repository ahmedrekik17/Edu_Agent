const StatCard = ({ title, value, change, icon, trend = 'up', color = 'blue' }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-indigo-500',
        green: 'from-emerald-500 to-teal-500',
        orange: 'from-amber-500 to-orange-500',
        purple: 'from-purple-500 to-pink-500',
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 card-hover">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                    {change && (
                        <div className="flex items-center mt-2 space-x-1">
                            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {trend === 'up' ? '↑' : '↓'} {change}
                            </span>
                            <span className="text-xs text-gray-500">vs last week</span>
                        </div>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white text-2xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
