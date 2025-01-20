export const getStartOfDay = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export const getStartOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    const mondayOffset = dayOfWeek === 0 ? -6 : 1; 
    const startOfWeek = new Date(now);
    
    startOfWeek.setDate(now.getDate() + mondayOffset);
    
    startOfWeek.setHours(0, 0, 0, 0);
    
    return startOfWeek;
}

export const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export const getStartOfYear = () => {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export const calendarShortcuts = [
    {
        text: 'Этот день',
        value: () => {
        return [getStartOfDay(), new Date()]
        },
    },
    {
        text: 'Эта неделя',
        value: () => {
        return [getStartOfWeek(), new Date()]
        },
    },
    {
        text: 'Этот месяц',
        value: () => {
        return [getStartOfMonth(), new Date()]
        },
    },
    {
        text: 'Этот год',
        value: () => {
        return [getStartOfYear(), new Date()]
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

