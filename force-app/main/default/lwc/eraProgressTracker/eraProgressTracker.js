import { LightningElement, api } from 'lwc';

export default class EraProgressTracker extends LightningElement {
    @api member;
    @api policyTier;
    @api vehicle;
    @api faultType;
    @api safety;
    @api restrictions;
    @api location;
    @api distance;
    @api towingLimit;
    @api dispatchRef;
    @api accommodationEligibility;
    @api bookingRef;

    get capturedFields() {
        const fields = [
            { label: 'Member', value: this.member },
            { label: 'Policy Tier', value: this.policyTier },
            { label: 'Vehicle', value: this.vehicle },
            { label: 'Fault Type', value: this.faultType },
            { label: 'Safety', value: this.safety },
            { label: 'Location', value: this.location },
            { label: 'Distance', value: this.distance },
            { label: 'Towing Limit', value: this.towingLimit },
            { label: 'Dispatch Ref', value: this.dispatchRef },
            { label: 'Booking Ref', value: this.bookingRef },
        ];
        return fields.filter(f => f.value && f.value !== 'pending' && f.value !== 'not_covered');
    }

    get pendingFields() {
        const fields = [
            { label: 'Member', value: this.member },
            { label: 'Policy Tier', value: this.policyTier },
            { label: 'Vehicle', value: this.vehicle },
            { label: 'Fault Type', value: this.faultType },
            { label: 'Location', value: this.location },
            { label: 'Distance', value: this.distance },
            { label: 'Dispatch Ref', value: this.dispatchRef },
        ];
        return fields.filter(f => !f.value || f.value === 'pending');
    }

    get notCoveredFields() {
        const fields = [
            { label: 'Accommodation', value: this.accommodationEligibility },
        ];
        return fields.filter(f => f.value === 'not_covered');
    }
}
