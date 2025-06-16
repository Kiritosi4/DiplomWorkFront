export const getStartOfDay = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export const getEndOfDay = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

export const getStartOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    const mondayOffset = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; 
    const mondayDate = new Date(now);
    
    mondayDate.setDate(now.getDate() + mondayOffset);
    mondayDate.setHours(0, 0, 0, 0); 

    return mondayDate;
}

export const getEndOfWeek = () => {
    const now = new Date();
    const lastDayOfWeek = now.getDate() + (6 - now.getDay()); 
    return new Date(now.getFullYear(), now.getMonth(), lastDayOfWeek, 23, 59, 59, 999);
}

export const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export const getEndOfMonth = () => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); 
    return new Date(now.getFullYear(), now.getMonth(), lastDayOfMonth, 23, 59, 59, 999);
}

export const getStartOfYear = () => {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export const getEndOfYear = () => {
    const now = new Date();
    return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); 
}

export const calendarShortcuts = [
    {
        text: 'Этот день',
        value: () => {
        return [getStartOfDay(), getEndOfDay()]
        },
    },
    {
        text: 'Эта неделя',
        value: () => {
        return [getStartOfWeek(), getEndOfDay()]
        },
    },
    {
        text: 'Этот месяц',
        value: () => {
        return [getStartOfMonth(), getEndOfDay()]
        },
    },
    {
        text: 'Этот год',
        value: () => {
        return [getStartOfYear(), getEndOfDay()]
        },
    },
    {
        text: '1 д.',
        value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24)
        return [start, end]
        },
    },
    {
        text: '7 д.',
        value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
        return [start, end]
        },
    },
    {
        text: '30 д.',
        value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
        return [start, end]
        },
    },
    {
        text: '1 год',
        value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 30 * 12)
        return [start, end]
        },
    },
]

export const getMaxTimestampByPeriod = (periodId) => {
    switch (periodId) {
        case 0:
            return milisToSec(getEndOfDay().valueOf())
        case 1:
            return milisToSec(getEndOfWeek().valueOf())
        case 2:
            return milisToSec(getEndOfMonth().valueOf())
        case 3:
            return milisToSec(getEndOfYear().valueOf())
        default:
            return 0
    }
}

export const getMinTimestampByPeriod = (periodId) => {
    switch (periodId) {
        case 0:
            return milisToSec(getStartOfDay().valueOf())
        case 1:
            return milisToSec(getStartOfWeek().valueOf())
        case 2:
            return milisToSec(getStartOfMonth().valueOf())
        case 3:
            return milisToSec(getStartOfYear().valueOf())
        default:
            return 0
    }
}

export const milisToSec = (milis) => {
    return Math.floor(milis / 1000)
}

export const secToDate = (timestampInSeconds) => {
    
    const timestampInMilliseconds = timestampInSeconds * 1000;
    
    return new Date(timestampInMilliseconds);
}
