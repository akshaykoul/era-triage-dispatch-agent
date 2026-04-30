public with sharing class ERA_HotelSearch {

    @InvocableMethod(
        label='Search Nearby Hotels'
        description='Returns 3 mock nearby hotels for the given breakdown location'
    )
    public static List<Result> execute(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            r.isSuccess = true;
            r.hotel1Name = 'Comfort Inn Melbourne CBD';
            r.hotel1Address = '123 Collins St, Melbourne VIC 3000';
            r.hotel1NightlyRate = 145.00;
            r.hotel1DistanceKm = 2;
            r.hotel2Name = 'Quest Serviced Apartments';
            r.hotel2Address = '45 Swanston St, Melbourne VIC 3000';
            r.hotel2NightlyRate = 160.00;
            r.hotel2DistanceKm = 3;
            r.hotel3Name = 'Holiday Inn Express';
            r.hotel3Address = '789 Bourke St, Melbourne VIC 3000';
            r.hotel3NightlyRate = 135.00;
            r.hotel3DistanceKm = 1;
            results.add(r);
        }
        return results;
    }

    public class Request {
        @InvocableVariable(label='Breakdown Location' description='Address or suburb of breakdown' required=true)
        public String breakdownLocation;
    }

    public class Result {
        @InvocableVariable(label='Is Success') public Boolean isSuccess;
        @InvocableVariable(label='Hotel 1 Name') public String hotel1Name;
        @InvocableVariable(label='Hotel 1 Address') public String hotel1Address;
        @InvocableVariable(label='Hotel 1 Nightly Rate') public Decimal hotel1NightlyRate;
        @InvocableVariable(label='Hotel 1 Distance km') public Integer hotel1DistanceKm;
        @InvocableVariable(label='Hotel 2 Name') public String hotel2Name;
        @InvocableVariable(label='Hotel 2 Address') public String hotel2Address;
        @InvocableVariable(label='Hotel 2 Nightly Rate') public Decimal hotel2NightlyRate;
        @InvocableVariable(label='Hotel 2 Distance km') public Integer hotel2DistanceKm;
        @InvocableVariable(label='Hotel 3 Name') public String hotel3Name;
        @InvocableVariable(label='Hotel 3 Address') public String hotel3Address;
        @InvocableVariable(label='Hotel 3 Nightly Rate') public Decimal hotel3NightlyRate;
        @InvocableVariable(label='Hotel 3 Distance km') public Integer hotel3DistanceKm;
    }
}
