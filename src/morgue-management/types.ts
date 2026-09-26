export interface StorageUnit {
    uuid: string;
    display: string;
    location?: { uuid: string; display: string };
}

export interface Compartment {
    uuid: string;
    display: string;
    status: string;
    storageUnit?: { uuid: string; display: string };
}