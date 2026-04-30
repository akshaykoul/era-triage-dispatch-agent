import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class EraHotelResults extends LightningElement {
    @api hotel1Name; @api hotel1Address; @api hotel1Rate; @api hotel1Distance;
    @api hotel2Name; @api hotel2Address; @api hotel2Rate; @api hotel2Distance;
    @api hotel3Name; @api hotel3Address; @api hotel3Rate; @api hotel3Distance;
    @api selectedHotelName = '';
    @api selectedHotelAddress = '';
    @api selectedHotelRate = 0;
    @api checkIn = '';
    @api checkOut = '';
    @api rooms = 1;

    @track bookingState = {};

    get hotels() {
        return [
            { id: '1', name: this.hotel1Name, address: this.hotel1Address, rate: this.hotel1Rate, distance: this.hotel1Distance, booking: this.bookingState['1'] },
            { id: '2', name: this.hotel2Name, address: this.hotel2Address, rate: this.hotel2Rate, distance: this.hotel2Distance, booking: this.bookingState['2'] },
            { id: '3', name: this.hotel3Name, address: this.hotel3Address, rate: this.hotel3Rate, distance: this.hotel3Distance, booking: this.bookingState['3'] },
        ];
    }

    handleBook(event) {
        const id = event.currentTarget.dataset.id;
        this.bookingState = { [id]: true };
    }

    handleDateChange(event) {
        const field = event.currentTarget.dataset.field;
        if (field === 'checkIn') this.checkIn = event.target.value;
        if (field === 'checkOut') this.checkOut = event.target.value;
        if (field === 'rooms') this.rooms = event.target.value;
    }

    handleConfirmBooking(event) {
        const id = event.currentTarget.dataset.id;
        const hotel = this.hotels.find(h => h.id === id);
        this.selectedHotelName = hotel.name;
        this.selectedHotelAddress = hotel.address;
        this.selectedHotelRate = hotel.rate;
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedHotelName', hotel.name));
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedHotelAddress', hotel.address));
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedHotelRate', hotel.rate));
        this.dispatchEvent(new FlowAttributeChangeEvent('checkIn', this.checkIn));
        this.dispatchEvent(new FlowAttributeChangeEvent('checkOut', this.checkOut));
        this.dispatchEvent(new FlowAttributeChangeEvent('rooms', this.rooms));
        this.dispatchEvent(new CustomEvent('bookingconfirmed', {
            detail: { hotelName: hotel.name, hotelAddress: hotel.address, rate: hotel.rate, checkIn: this.checkIn, checkOut: this.checkOut, rooms: this.rooms },
            bubbles: true, composed: true
        }));
    }
}
