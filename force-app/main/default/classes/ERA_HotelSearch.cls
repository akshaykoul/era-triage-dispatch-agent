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
            r.hotel1Name = 'Comfort Inn 12 Apostles';
            r.hotel1Address = '42 Gibson Steps Rd, Princetown VIC 3269';
            r.hotel1NightlyRate = '$145/night';
            r.hotel1DistanceKm = '3 km away';
            r.hotel2Name = 'Port Campbell Motor Inn';
            r.hotel2Address = '18 Lord St, Port Campbell VIC 3269';
            r.hotel2NightlyRate = '$130/night';
            r.hotel2DistanceKm = '7 km away';
            r.hotel3Name = 'Loch Ard Motor Inn';
            r.hotel3Address = '64 Lord St, Port Campbell VIC 3269';
            r.hotel3NightlyRate = '$160/night';
            r.hotel3DistanceKm = '8 km away';
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
        @InvocableVariable(label='Hotel 1 Nightly Rate') public String hotel1NightlyRate;
        @InvocableVariable(label='Hotel 1 Distance km') public String hotel1DistanceKm;
        @InvocableVariable(label='Hotel 2 Name') public String hotel2Name;
        @InvocableVariable(label='Hotel 2 Address') public String hotel2Address;
        @InvocableVariable(label='Hotel 2 Nightly Rate') public String hotel2NightlyRate;
        @InvocableVariable(label='Hotel 2 Distance km') public String hotel2DistanceKm;
        @InvocableVariable(label='Hotel 3 Name') public String hotel3Name;
        @InvocableVariable(label='Hotel 3 Address') public String hotel3Address;
        @InvocableVariable(label='Hotel 3 Nightly Rate') public String hotel3NightlyRate;
        @InvocableVariable(label='Hotel 3 Distance km') public String hotel3DistanceKm;
    }
}
