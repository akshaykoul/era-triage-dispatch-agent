import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    'ERA_Dispatch__c.Member__r.Name', 'ERA_Dispatch__c.Product_Tier__c',
    'ERA_Dispatch__c.Policy_Number__c', 'ERA_Dispatch__c.Vehicle__r.Name',
    'ERA_Dispatch__c.Fault_Type__c', 'ERA_Dispatch__c.Towing_Limit_km__c',
    'ERA_Dispatch__c.Breakdown_Location__c', 'ERA_Dispatch__c.Distance_From_Home__c',
    'ERA_Dispatch__c.Dispatch_Restriction__c', 'ERA_Dispatch__c.Safety_Concern__c',
    'ERA_Dispatch__c.Caravan_Trailer__c', 'ERA_Dispatch__c.Notes__c',
    'ERA_Dispatch__c.Status__c'
];

export default class EraDispatchCard extends LightningElement {
    @api recordId;
    record = {};

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({ data }) {
        if (data) {
            this.record = Object.fromEntries(
                Object.entries(data.fields).map(([k, v]) => [k, v.value])
            );
            if (data.fields.Member__r) this.record['Member__r'] = { Name: data.fields.Member__r.value?.fields?.Name?.value };
            if (data.fields.Vehicle__r) this.record['Vehicle__r'] = { Name: data.fields.Vehicle__r.value?.fields?.Name?.value };
        }
    }

    get safetyConcernLabel() { return this.record.Safety_Concern__c ? 'Yes' : 'No'; }
    get caravanLabel() { return this.record.Caravan_Trailer__c ? 'Yes' : 'No'; }
    get statusBadgeClass() {
        const status = this.record.Status__c;
        if (status === 'Dispatched') return 'slds-badge slds-badge_success';
        if (status === 'Submitted') return 'slds-badge slds-badge_warning';
        return 'slds-badge';
    }
}
