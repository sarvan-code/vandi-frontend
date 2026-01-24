let activeRequests = 0;
let subscribers = [];

export const subscribe = (callback) => {
    subscribers.push(callback);
    return () => {
        subscribers = subscribers.filter(cb => cb !== callback);
    };
};

const notifySubscribers = () => {
    const isActive = activeRequests > 0;
    subscribers.forEach(cb => cb(isActive));
};

export const showLoading = () => {
    activeRequests++;
    notifySubscribers();
};

export const hideLoading = () => {
    if (activeRequests > 0) {
        activeRequests--;
        notifySubscribers();
    }
};
