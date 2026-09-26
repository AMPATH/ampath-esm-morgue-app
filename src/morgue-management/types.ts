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

export interface StorageAssignment {
    uuid: string;
    patient: { uuid: string; display: string };
    compartment: {
        uuid: string;
        display: string;
        storageUnit?: { uuid: string; display: string };
    };
    dateAdmitted: string;
    dateDischarged: string | null;
    status: 'OCCUPIED' | 'DISCHARGED';
}