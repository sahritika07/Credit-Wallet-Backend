export const success = (data: any) => ({ success: true, data });
export const fail = (message: string, details?: any) => ({ success: false, error: { message, details: details || null } });
