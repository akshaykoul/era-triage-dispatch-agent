import { LightningElement, api, wire } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';

export default class EraBookingList extends LightningElement {
    @api recordId;
    bookings = [];

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'ERA_Accommodation_Bookings__r',
        fields: ['ERA_Accommodation_Booking__c.Name', 'ERA_Accommodation_Booking__c.Dispatch__r.Name',
                 'ERA_Accommodation_Booking__c.Hotel_Name__c', 'ERA_Accommodation_Booking__c.Check_In__c',
                 'ERA_Accommodation_Booking__c.Check_Out__c', 'ERA_Accommodation_Booking__c.Rooms__c',
                 'ERA_Accommodation_Booking__c.Total_Cost__c', 'ERA_Accommodation_Booking__c.Booking_Status__c']
    })
    wiredBookings({ data }) {
        if (data) {
            this.bookings = data.records.map(r => Object.fromEntries(
                Object.entries(r.fields).map(([k, v]) => [k, v.value])
            ));
        }
    }

    get hasBookings() { return this.bookings.length > 0; }
}
