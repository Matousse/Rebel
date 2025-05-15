export declare const IDL: {
    version: string;
    name: string;
    instructions: {
        name: string;
        accounts: {
            name: string;
            isMut: boolean;
            isSigner: boolean;
        }[];
        args: {
            name: string;
            type: {
                array: (string | number)[];
            };
        }[];
    }[];
    accounts: {
        name: string;
        type: {
            kind: string;
            fields: ({
                name: string;
                type: string;
            } | {
                name: string;
                type: {
                    array: (string | number)[];
                };
            })[];
        };
    }[];
    errors: {
        code: number;
        name: string;
        msg: string;
    }[];
};
