export type STATUS_TYPE = "client_error" | "server_error" | "success";
export type STATUS_CODE = 200 | 400 | 500; // handle the status codes later 

export interface JSON_RESPONSE {    
    status: STATUS_TYPE,
    message: string,
    data?: Object
}
