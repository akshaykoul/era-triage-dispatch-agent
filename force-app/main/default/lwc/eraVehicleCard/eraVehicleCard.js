import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class EraVehicleCard extends LightningElement {
    @api make;
    @api model;
    @api registration;
    @api vehicleType;
    @api year;
    @api confirmed = false;

    handleConfirm() {
        this.confirmed = true;
        this.dispatchEvent(new FlowAttributeChangeEvent('confirmed', true));
        this.dispatchEvent(new CustomEvent('vehicleconfirmed', { detail: { confirmed: true }, bubbles: true, composed: true }));
    }

    handleDifferent() {
        this.confirmed = false;
        this.dispatchEvent(new FlowAttributeChangeEvent('confirmed', false));
        this.dispatchEvent(new CustomEvent('vehicleconfirmed', { detail: { confirmed: false }, bubbles: true, composed: true }));
    }
}
