class ApiError extends Error {
    constructor(status , message, error =[]){
        super(message);
        this.status = status,
        this.error = error
    }
} 

export {ApiError};