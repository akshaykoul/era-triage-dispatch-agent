# ERA Triage & Dispatch Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Agentforce Employee Agent that guides contact center reps through capturing ERA breakdown details, creating a dispatch record, and booking accommodation — all from the OmniChannel screen.

**Architecture:** Two-topic Agent Script (ERA_Triage + ERA_Accommodation) backed by three custom objects (Vehicle__c, ERA_Dispatch__c, ERA_Accommodation_Booking__c), four Flows, one Apex mock callout, and six LWC components (four Agentforce messaging components + two record page components).

**Tech Stack:** Salesforce (API v62+), Agent Script DSL, Apex, Autolaunched Flows, LWC (Agentforce Messaging Components + record page), SFDX project structure, sf CLI

---

## File Map

```
force-app/main/default/
├── objects/
│   ├── Vehicle__c/
│   │   ├── Vehicle__c.object-meta.xml
│   │   └── fields/
│   │       ├── Account__c.field-meta.xml
│   │       ├── Make__c.field-meta.xml
│   │       ├── Model__c.field-meta.xml
│   │       ├── Registration__c.field-meta.xml
│   │       ├── Vehicle_Type__c.field-meta.xml
│   │       └── Year__c.field-meta.xml
│   ├── ERA_Dispatch__c/
│   │   ├── ERA_Dispatch__c.object-meta.xml
│   │   └── fields/
│   │       ├── Member__c.field-meta.xml
│   │       ├── Policy_Number__c.field-meta.xml
│   │       ├── Product_Tier__c.field-meta.xml
│   │       ├── Vehicle__c.field-meta.xml
│   │       ├── Breakdown_Location__c.field-meta.xml
│   │       ├── Distance_From_Home__c.field-meta.xml
│   │       ├── Fault_Type__c.field-meta.xml
│   │       ├── Safety_Concern__c.field-meta.xml
│   │       ├── Injury_Details__c.field-meta.xml
│   │       ├── Dispatch_Restriction__c.field-meta.xml
│   │       ├── Caravan_Trailer__c.field-meta.xml
│   │       ├── Status__c.field-meta.xml
│   │       ├── Towing_Limit_km__c.field-meta.xml
│   │       └── Notes__c.field-meta.xml
│   └── ERA_Accommodation_Booking__c/
│       ├── ERA_Accommodation_Booking__c.object-meta.xml
│       └── fields/
│           ├── Member__c.field-meta.xml
│           ├── Dispatch__c.field-meta.xml
│           ├── Hotel_Name__c.field-meta.xml
│           ├── Hotel_Address__c.field-meta.xml
│           ├── Check_In__c.field-meta.xml
│           ├── Check_Out__c.field-meta.xml
│           ├── Rooms__c.field-meta.xml
│           ├── Nightly_Rate__c.field-meta.xml
│           ├── Total_Cost__c.field-meta.xml
│           ├── Policy_Allowance__c.field-meta.xml
│           └── Booking_Status__c.field-meta.xml
├── classes/
│   ├── ERA_HotelSearch.cls
│   └── ERA_HotelSearch.cls-meta.xml
├── flows/
│   ├── ERA_Get_Vehicle_Details.flow-meta.xml
│   ├── ERA_Create_Dispatch.flow-meta.xml
│   └── ERA_Create_Booking.flow-meta.xml
├── lwc/
│   ├── eraProgressTracker/
│   │   ├── eraProgressTracker.html
│   │   ├── eraProgressTracker.js
│   │   └── eraProgressTracker.js-meta.xml
│   ├── eraFaultSelector/
│   │   ├── eraFaultSelector.html
│   │   ├── eraFaultSelector.js
│   │   └── eraFaultSelector.js-meta.xml
│   ├── eraVehicleCard/
│   │   ├── eraVehicleCard.html
│   │   ├── eraVehicleCard.js
│   │   └── eraVehicleCard.js-meta.xml
│   ├── eraHotelResults/
│   │   ├── eraHotelResults.html
│   │   ├── eraHotelResults.js
│   │   └── eraHotelResults.js-meta.xml
│   ├── eraDispatchCard/
│   │   ├── eraDispatchCard.html
│   │   ├── eraDispatchCard.js
│   │   └── eraDispatchCard.js-meta.xml
│   └── eraBookingList/
│       ├── eraBookingList.html
│       ├── eraBookingList.js
│       └── eraBookingList.js-meta.xml
└── aiAuthoringBundles/
    └── ERA_Triage_Dispatch/
        └── ERA_Triage_Dispatch.agent
```

---

## Task 1: Scaffold SFDX Project

**Files:**
- Create: `sfdx-project.json`
- Create: `force-app/main/default/.gitkeep`

- [ ] **Step 1: Create sfdx-project.json**

```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "default": true
    }
  ],
  "namespace": "",
  "sfdcLoginUrl": "https://login.salesforce.com",
  "sourceApiVersion": "62.0"
}
```

Save to `/Users/akshay.koul/WorkingFolderClaude/sfdx-project.json`

- [ ] **Step 2: Create directory structure**

```bash
mkdir -p force-app/main/default/objects
mkdir -p force-app/main/default/classes
mkdir -p force-app/main/default/flows
mkdir -p force-app/main/default/lwc
mkdir -p force-app/main/default/aiAuthoringBundles/ERA_Triage_Dispatch
```

- [ ] **Step 3: Verify sf CLI can see the project**

```bash
sf project display
```
Expected: shows `force-app` as default package directory.

- [ ] **Step 4: Commit**

```bash
git add sfdx-project.json force-app/
git commit -m "feat: scaffold SFDX project structure"
```

---

## Task 2: Vehicle__c Custom Object

**Files:**
- Create: `force-app/main/default/objects/Vehicle__c/Vehicle__c.object-meta.xml`
- Create: `force-app/main/default/objects/Vehicle__c/fields/*.field-meta.xml` (6 files)

- [ ] **Step 1: Create object definition**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <label>Vehicle</label>
    <nameField>
        <displayFormat>VEH-{0000}</displayFormat>
        <label>Vehicle Number</label>
        <type>AutoNumber</type>
    </nameField>
    <pluralLabel>Vehicles</pluralLabel>
    <sharingModel>ReadWrite</sharingModel>
</CustomObject>
```

Save to `force-app/main/default/objects/Vehicle__c/Vehicle__c.object-meta.xml`

- [ ] **Step 2: Create Account lookup field**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Account__c</fullName>
    <label>Account</label>
    <referenceTo>Account</referenceTo>
    <relationshipLabel>Vehicles</relationshipLabel>
    <relationshipName>Vehicles</relationshipName>
    <required>true</required>
    <type>Lookup</type>
</CustomField>
```

Save to `force-app/main/default/objects/Vehicle__c/fields/Account__c.field-meta.xml`

- [ ] **Step 3: Create Make, Model, Registration fields**

`Make__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Make__c</fullName>
    <label>Make</label>
    <length>100</length>
    <required>false</required>
    <type>Text</type>
    <unique>false</unique>
</CustomField>
```

`Model__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Model__c</fullName>
    <label>Model</label>
    <length>100</length>
    <required>false</required>
    <type>Text</type>
    <unique>false</unique>
</CustomField>
```

`Registration__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Registration__c</fullName>
    <label>Registration</label>
    <length>20</length>
    <required>false</required>
    <type>Text</type>
    <unique>false</unique>
</CustomField>
```

- [ ] **Step 4: Create Vehicle_Type picklist and Year fields**

`Vehicle_Type__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Vehicle_Type__c</fullName>
    <label>Vehicle Type</label>
    <required>false</required>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value><fullName>Car</fullName><default>true</default><label>Car</label></value>
            <value><fullName>Motorcycle</fullName><default>false</default><label>Motorcycle</label></value>
            <value><fullName>EV</fullName><default>false</default><label>EV</label></value>
            <value><fullName>Caravan</fullName><default>false</default><label>Caravan</label></value>
            <value><fullName>Trailer</fullName><default>false</default><label>Trailer</label></value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

`Year__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Year__c</fullName>
    <label>Year</label>
    <precision>4</precision>
    <scale>0</scale>
    <required>false</required>
    <type>Number</type>
    <unique>false</unique>
</CustomField>
```

- [ ] **Step 5: Deploy Vehicle__c**

```bash
sf project deploy start --source-dir force-app/main/default/objects/Vehicle__c --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded — Vehicle__c, 6 fields.

- [ ] **Step 6: Commit**

```bash
git add force-app/main/default/objects/Vehicle__c/
git commit -m "feat: add Vehicle__c custom object"
```

---

## Task 3: ERA_Dispatch__c Custom Object

**Files:**
- Create: `force-app/main/default/objects/ERA_Dispatch__c/ERA_Dispatch__c.object-meta.xml`
- Create: `force-app/main/default/objects/ERA_Dispatch__c/fields/*.field-meta.xml` (13 files)

- [ ] **Step 1: Create object definition**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <label>ERA Dispatch</label>
    <nameField>
        <displayFormat>DSP-{0000}</displayFormat>
        <label>Dispatch Number</label>
        <type>AutoNumber</type>
    </nameField>
    <pluralLabel>ERA Dispatches</pluralLabel>
    <sharingModel>ReadWrite</sharingModel>
</CustomObject>
```

Save to `force-app/main/default/objects/ERA_Dispatch__c/ERA_Dispatch__c.object-meta.xml`

- [ ] **Step 2: Create Member and Vehicle lookup fields**

`Member__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Member__c</fullName>
    <label>Member</label>
    <referenceTo>Account</referenceTo>
    <relationshipLabel>ERA Dispatches</relationshipLabel>
    <relationshipName>ERA_Dispatches</relationshipName>
    <required>true</required>
    <type>Lookup</type>
</CustomField>
```

`Vehicle__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Vehicle__c</fullName>
    <label>Vehicle</label>
    <referenceTo>Vehicle__c</referenceTo>
    <relationshipLabel>ERA Dispatches</relationshipLabel>
    <relationshipName>ERA_Dispatches</relationshipName>
    <required>false</required>
    <type>Lookup</type>
</CustomField>
```

- [ ] **Step 3: Create text and picklist fields**

`Policy_Number__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Policy_Number__c</fullName><label>Policy Number</label>
    <length>50</length><required>false</required><type>Text</type><unique>false</unique>
</CustomField>
```

`Product_Tier__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Product_Tier__c</fullName>
    <label>Product Tier</label>
    <required>false</required>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value><fullName>Total Care</fullName><default>false</default><label>Total Care</label></value>
            <value><fullName>Extra Care</fullName><default>false</default><label>Extra Care</label></value>
            <value><fullName>Roadside Care</fullName><default>false</default><label>Roadside Care</label></value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

`Breakdown_Location__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Breakdown_Location__c</fullName><label>Breakdown Location</label>
    <length>255</length><required>false</required><type>Text</type><unique>false</unique>
</CustomField>
```

`Distance_From_Home__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Distance_From_Home__c</fullName>
    <label>Distance From Home</label>
    <required>false</required>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value><fullName>Under 100km</fullName><default>false</default><label>Under 100km</label></value>
            <value><fullName>Over 100km</fullName><default>false</default><label>Over 100km</label></value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

`Fault_Type__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Fault_Type__c</fullName>
    <label>Fault Type</label>
    <required>false</required>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value><fullName>Mechanical</fullName><default>false</default><label>Mechanical</label></value>
            <value><fullName>Flat Tyre</fullName><default>false</default><label>Flat Tyre</label></value>
            <value><fullName>Fuel</fullName><default>false</default><label>Fuel</label></value>
            <value><fullName>Lockout</fullName><default>false</default><label>Lockout</label></value>
            <value><fullName>EV Out of Charge</fullName><default>false</default><label>EV Out of Charge</label></value>
            <value><fullName>Fire</fullName><default>false</default><label>Fire</label></value>
            <value><fullName>Other</fullName><default>false</default><label>Other</label></value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

`Status__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Status__c</fullName>
    <label>Status</label>
    <required>false</required>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value><fullName>Draft</fullName><default>true</default><label>Draft</label></value>
            <value><fullName>Submitted</fullName><default>false</default><label>Submitted</label></value>
            <value><fullName>Dispatched</fullName><default>false</default><label>Dispatched</label></value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

- [ ] **Step 4: Create checkbox, textarea, and formula fields**

`Safety_Concern__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Safety_Concern__c</fullName><label>Safety Concern</label>
    <defaultValue>false</defaultValue><type>Checkbox</type>
</CustomField>
```

`Injury_Details__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Injury_Details__c</fullName><label>Injury Details</label>
    <length>500</length><type>LongTextArea</type><visibleLines>3</visibleLines>
</CustomField>
```

`Dispatch_Restriction__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Dispatch_Restriction__c</fullName><label>Dispatch Restriction</label>
    <length>255</length><required>false</required><type>Text</type><unique>false</unique>
</CustomField>
```

`Caravan_Trailer__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Caravan_Trailer__c</fullName><label>Caravan / Trailer</label>
    <defaultValue>false</defaultValue><type>Checkbox</type>
</CustomField>
```

`Notes__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Notes__c</fullName><label>Notes</label>
    <length>1000</length><type>LongTextArea</type><visibleLines>4</visibleLines>
</CustomField>
```

`Towing_Limit_km__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Towing_Limit_km__c</fullName>
    <label>Towing Limit (km)</label>
    <formula>IF(ISPICKVAL(Product_Tier__c, 'Total Care'), 100, IF(ISPICKVAL(Product_Tier__c, 'Extra Care'), 60, 20))</formula>
    <formulaTreatBlanksAs>BlankAsZero</formulaTreatBlanksAs>
    <precision>18</precision>
    <scale>0</scale>
    <type>Number</type>
</CustomField>
```

- [ ] **Step 5: Deploy ERA_Dispatch__c**

```bash
sf project deploy start --source-dir force-app/main/default/objects/ERA_Dispatch__c --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded — ERA_Dispatch__c, 13 fields.

- [ ] **Step 6: Commit**

```bash
git add force-app/main/default/objects/ERA_Dispatch__c/
git commit -m "feat: add ERA_Dispatch__c custom object"
```

---

## Task 4: ERA_Accommodation_Booking__c Custom Object

**Files:**
- Create: `force-app/main/default/objects/ERA_Accommodation_Booking__c/ERA_Accommodation_Booking__c.object-meta.xml`
- Create: `force-app/main/default/objects/ERA_Accommodation_Booking__c/fields/*.field-meta.xml` (10 fields)

- [ ] **Step 1: Create object definition**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <label>ERA Accommodation Booking</label>
    <nameField>
        <displayFormat>BKG-{0000}</displayFormat>
        <label>Booking Number</label>
        <type>AutoNumber</type>
    </nameField>
    <pluralLabel>ERA Accommodation Bookings</pluralLabel>
    <sharingModel>ReadWrite</sharingModel>
</CustomObject>
```

- [ ] **Step 2: Create lookup fields**

`Member__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Member__c</fullName><label>Member</label>
    <referenceTo>Account</referenceTo>
    <relationshipLabel>ERA Accommodation Bookings</relationshipLabel>
    <relationshipName>ERA_Accommodation_Bookings</relationshipName>
    <required>true</required><type>Lookup</type>
</CustomField>
```

`Dispatch__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Dispatch__c</fullName><label>Dispatch</label>
    <referenceTo>ERA_Dispatch__c</referenceTo>
    <relationshipLabel>Accommodation Bookings</relationshipLabel>
    <relationshipName>Accommodation_Bookings</relationshipName>
    <required>false</required><type>Lookup</type>
</CustomField>
```

- [ ] **Step 3: Create hotel and date fields**

`Hotel_Name__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Hotel_Name__c</fullName><label>Hotel Name</label>
    <length>200</length><required>false</required><type>Text</type><unique>false</unique>
</CustomField>
```

`Hotel_Address__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Hotel_Address__c</fullName><label>Hotel Address</label>
    <length>255</length><required>false</required><type>Text</type><unique>false</unique>
</CustomField>
```

`Check_In__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Check_In__c</fullName><label>Check In</label><required>false</required><type>Date</type>
</CustomField>
```

`Check_Out__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Check_Out__c</fullName><label>Check Out</label><required>false</required><type>Date</type>
</CustomField>
```

`Rooms__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Rooms__c</fullName><label>Rooms</label>
    <precision>2</precision><scale>0</scale><required>false</required><type>Number</type><unique>false</unique>
</CustomField>
```

- [ ] **Step 4: Create currency and formula fields**

`Nightly_Rate__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Nightly_Rate__c</fullName><label>Nightly Rate</label>
    <precision>8</precision><scale>2</scale><required>false</required><type>Currency</type>
</CustomField>
```

`Policy_Allowance__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Policy_Allowance__c</fullName><label>Policy Allowance (per night)</label>
    <precision>8</precision><scale>2</scale><required>false</required><type>Currency</type>
</CustomField>
```

`Total_Cost__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Total_Cost__c</fullName><label>Total Cost</label>
    <formula>Nightly_Rate__c * (Check_Out__c - Check_In__c)</formula>
    <formulaTreatBlanksAs>BlankAsZero</formulaTreatBlanksAs>
    <precision>18</precision><scale>2</scale><type>Currency</type>
</CustomField>
```

`Booking_Status__c.field-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Booking_Status__c</fullName>
    <label>Booking Status</label>
    <required>false</required>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value><fullName>Pending</fullName><default>true</default><label>Pending</label></value>
            <value><fullName>Confirmed</fullName><default>false</default><label>Confirmed</label></value>
            <value><fullName>Cancelled</fullName><default>false</default><label>Cancelled</label></value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

- [ ] **Step 5: Deploy ERA_Accommodation_Booking__c**

```bash
sf project deploy start --source-dir force-app/main/default/objects/ERA_Accommodation_Booking__c --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded — ERA_Accommodation_Booking__c, 10 fields.

- [ ] **Step 6: Commit**

```bash
git add force-app/main/default/objects/ERA_Accommodation_Booking__c/
git commit -m "feat: add ERA_Accommodation_Booking__c custom object"
```

---

## Task 5: ERA_HotelSearch Apex Class

**Files:**
- Create: `force-app/main/default/classes/ERA_HotelSearch.cls`
- Create: `force-app/main/default/classes/ERA_HotelSearch.cls-meta.xml`

- [ ] **Step 1: Write ERA_HotelSearch.cls**

```apex
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
```

Save to `force-app/main/default/classes/ERA_HotelSearch.cls`

- [ ] **Step 2: Create class meta file**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <status>Active</status>
</ApexClass>
```

Save to `force-app/main/default/classes/ERA_HotelSearch.cls-meta.xml`

- [ ] **Step 3: Deploy Apex class**

```bash
sf project deploy start --source-dir force-app/main/default/classes --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded — ERA_HotelSearch (ApexClass).

- [ ] **Step 4: Commit**

```bash
git add force-app/main/default/classes/
git commit -m "feat: add ERA_HotelSearch mock Apex callout"
```

---

## Task 6: Autolaunched Flows

**Files:**
- Create: `force-app/main/default/flows/ERA_Get_Vehicle_Details.flow-meta.xml`
- Create: `force-app/main/default/flows/ERA_Create_Dispatch.flow-meta.xml`
- Create: `force-app/main/default/flows/ERA_Create_Booking.flow-meta.xml`

- [ ] **Step 1: Create ERA_Get_Vehicle_Details flow**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <label>ERA Get Vehicle Details</label>
    <processType>AutoLaunchedFlow</processType>
    <status>Active</status>
    <variables>
        <name>AccountId</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>VehicleId</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <variables>
        <name>VehicleMake</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <variables>
        <name>VehicleModel</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <variables>
        <name>VehicleRegistration</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <variables>
        <name>VehicleType</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <variables>
        <name>VehicleYear</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <recordLookups>
        <name>Get_Vehicle</name>
        <label>Get Vehicle</label>
        <locationX>176</locationX><locationY>134</locationY>
        <assignNullValuesIfNoRecordsFound>true</assignNullValuesIfNoRecordsFound>
        <connector><targetReference>Set_Outputs</targetReference></connector>
        <filterLogic>and</filterLogic>
        <filters>
            <field>Account__c</field><operator>EqualTo</operator>
            <value><elementReference>AccountId</elementReference></value>
        </filters>
        <getFirstRecordOnly>true</getFirstRecordOnly>
        <object>Vehicle__c</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordLookups>
    <assignments>
        <name>Set_Outputs</name>
        <label>Set Outputs</label>
        <locationX>176</locationX><locationY>242</locationY>
        <assignmentItems>
            <assignToReference>VehicleId</assignToReference><operator>Assign</operator>
            <value><elementReference>Get_Vehicle.Id</elementReference></value>
        </assignmentItems>
        <assignmentItems>
            <assignToReference>VehicleMake</assignToReference><operator>Assign</operator>
            <value><elementReference>Get_Vehicle.Make__c</elementReference></value>
        </assignmentItems>
        <assignmentItems>
            <assignToReference>VehicleModel</assignToReference><operator>Assign</operator>
            <value><elementReference>Get_Vehicle.Model__c</elementReference></value>
        </assignmentItems>
        <assignmentItems>
            <assignToReference>VehicleRegistration</assignToReference><operator>Assign</operator>
            <value><elementReference>Get_Vehicle.Registration__c</elementReference></value>
        </assignmentItems>
        <assignmentItems>
            <assignToReference>VehicleType</assignToReference><operator>Assign</operator>
            <value><elementReference>Get_Vehicle.Vehicle_Type__c</elementReference></value>
        </assignmentItems>
        <assignmentItems>
            <assignToReference>VehicleYear</assignToReference><operator>Assign</operator>
            <value><elementReference>Get_Vehicle.Year__c</elementReference></value>
        </assignmentItems>
    </assignments>
    <start>
        <locationX>50</locationX><locationY>0</locationY>
        <connector><targetReference>Get_Vehicle</targetReference></connector>
    </start>
</Flow>
```

Save to `force-app/main/default/flows/ERA_Get_Vehicle_Details.flow-meta.xml`

- [ ] **Step 2: Create ERA_Create_Dispatch flow**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <label>ERA Create Dispatch</label>
    <processType>AutoLaunchedFlow</processType>
    <status>Active</status>
    <variables>
        <name>MemberId</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>PolicyNumber</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>ProductTier</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>VehicleId</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>BreakdownLocation</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>DistanceFromHome</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>FaultType</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>SafetyConcern</name><dataType>Boolean</dataType><isInput>true</isInput><isOutput>false</isOutput><value><booleanValue>false</booleanValue></value>
    </variables>
    <variables>
        <name>InjuryDetails</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>DispatchRestriction</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>CaravanTrailer</name><dataType>Boolean</dataType><isInput>true</isInput><isOutput>false</isOutput><value><booleanValue>false</booleanValue></value>
    </variables>
    <variables>
        <name>Notes</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>DispatchId</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <variables>
        <name>DispatchName</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <recordCreates>
        <name>Create_Dispatch</name>
        <label>Create Dispatch</label>
        <locationX>176</locationX><locationY>134</locationY>
        <connector><targetReference>Set_Dispatch_Outputs</targetReference></connector>
        <inputAssignments>
            <field>Member__c</field><value><elementReference>MemberId</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Policy_Number__c</field><value><elementReference>PolicyNumber</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Product_Tier__c</field><value><elementReference>ProductTier</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Vehicle__c</field><value><elementReference>VehicleId</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Breakdown_Location__c</field><value><elementReference>BreakdownLocation</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Distance_From_Home__c</field><value><elementReference>DistanceFromHome</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Fault_Type__c</field><value><elementReference>FaultType</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Safety_Concern__c</field><value><elementReference>SafetyConcern</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Injury_Details__c</field><value><elementReference>InjuryDetails</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Dispatch_Restriction__c</field><value><elementReference>DispatchRestriction</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Caravan_Trailer__c</field><value><elementReference>CaravanTrailer</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Notes__c</field><value><elementReference>Notes</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Status__c</field><value><stringValue>Submitted</stringValue></value>
        </inputAssignments>
        <object>ERA_Dispatch__c</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordCreates>
    <assignments>
        <name>Set_Dispatch_Outputs</name>
        <label>Set Dispatch Outputs</label>
        <locationX>176</locationX><locationY>242</locationY>
        <assignmentItems>
            <assignToReference>DispatchId</assignToReference><operator>Assign</operator>
            <value><elementReference>Create_Dispatch</elementReference></value>
        </assignmentItems>
    </assignments>
    <start>
        <locationX>50</locationX><locationY>0</locationY>
        <connector><targetReference>Create_Dispatch</targetReference></connector>
    </start>
</Flow>
```

Save to `force-app/main/default/flows/ERA_Create_Dispatch.flow-meta.xml`

- [ ] **Step 3: Create ERA_Create_Booking flow**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <label>ERA Create Booking</label>
    <processType>AutoLaunchedFlow</processType>
    <status>Active</status>
    <variables>
        <name>MemberId</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>DispatchId</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>HotelName</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>HotelAddress</name><dataType>String</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>CheckIn</name><dataType>Date</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>CheckOut</name><dataType>Date</dataType><isInput>true</isInput><isOutput>false</isOutput>
    </variables>
    <variables>
        <name>Rooms</name><dataType>Number</dataType><isInput>true</isInput><isOutput>false</isOutput><scale>0</scale>
    </variables>
    <variables>
        <name>NightlyRate</name><dataType>Currency</dataType><isInput>true</isInput><isOutput>false</isOutput><scale>2</scale>
    </variables>
    <variables>
        <name>PolicyAllowance</name><dataType>Currency</dataType><isInput>true</isInput><isOutput>false</isOutput><scale>2</scale>
    </variables>
    <variables>
        <name>BookingId</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <variables>
        <name>BookingName</name><dataType>String</dataType><isInput>false</isInput><isOutput>true</isOutput>
    </variables>
    <recordCreates>
        <name>Create_Booking</name>
        <label>Create Booking</label>
        <locationX>176</locationX><locationY>134</locationY>
        <connector><targetReference>Set_Booking_Outputs</targetReference></connector>
        <inputAssignments>
            <field>Member__c</field><value><elementReference>MemberId</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Dispatch__c</field><value><elementReference>DispatchId</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Hotel_Name__c</field><value><elementReference>HotelName</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Hotel_Address__c</field><value><elementReference>HotelAddress</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Check_In__c</field><value><elementReference>CheckIn</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Check_Out__c</field><value><elementReference>CheckOut</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Rooms__c</field><value><elementReference>Rooms</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Nightly_Rate__c</field><value><elementReference>NightlyRate</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Policy_Allowance__c</field><value><elementReference>PolicyAllowance</elementReference></value>
        </inputAssignments>
        <inputAssignments>
            <field>Booking_Status__c</field><value><stringValue>Confirmed</stringValue></value>
        </inputAssignments>
        <object>ERA_Accommodation_Booking__c</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordCreates>
    <assignments>
        <name>Set_Booking_Outputs</name>
        <label>Set Booking Outputs</label>
        <locationX>176</locationX><locationY>242</locationY>
        <assignmentItems>
            <assignToReference>BookingId</assignToReference><operator>Assign</operator>
            <value><elementReference>Create_Booking</elementReference></value>
        </assignmentItems>
    </assignments>
    <start>
        <locationX>50</locationX><locationY>0</locationY>
        <connector><targetReference>Create_Booking</targetReference></connector>
    </start>
</Flow>
```

Save to `force-app/main/default/flows/ERA_Create_Booking.flow-meta.xml`

- [ ] **Step 4: Deploy all flows**

```bash
sf project deploy start --source-dir force-app/main/default/flows --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded — 3 flows active.

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/flows/
git commit -m "feat: add ERA autolaunched flows for vehicle lookup, dispatch, and booking"
```

---

## Task 7: eraProgressTracker LWC (Agentforce Messaging Component)

**Files:**
- Create: `force-app/main/default/lwc/eraProgressTracker/eraProgressTracker.html`
- Create: `force-app/main/default/lwc/eraProgressTracker/eraProgressTracker.js`
- Create: `force-app/main/default/lwc/eraProgressTracker/eraProgressTracker.js-meta.xml`

- [ ] **Step 1: Create HTML template**

```html
<template>
    <div class="slds-card slds-p-around_small era-tracker">
        <h3 class="slds-text-heading_small slds-m-bottom_x-small">Call Progress</h3>

        <template if:true={capturedFields.length}>
            <p class="slds-text-body_small slds-m-bottom_xx-small" style="color:#2e7d32;font-weight:bold;">✓ Captured</p>
            <template for:each={capturedFields} for:item="f">
                <div key={f.label} class="slds-badge slds-m-right_xx-small slds-m-bottom_xx-small" style="background:#e8f5e9;color:#2e7d32;">{f.label}: {f.value}</div>
            </template>
        </template>

        <template if:true={pendingFields.length}>
            <p class="slds-text-body_small slds-m-top_x-small slds-m-bottom_xx-small" style="color:#e65100;font-weight:bold;">⏳ Pending</p>
            <template for:each={pendingFields} for:item="f">
                <div key={f.label} class="slds-badge slds-m-right_xx-small slds-m-bottom_xx-small" style="background:#fff3e0;color:#e65100;">{f.label}</div>
            </template>
        </template>

        <template if:true={notCoveredFields.length}>
            <p class="slds-text-body_small slds-m-top_x-small slds-m-bottom_xx-small" style="color:#c62828;font-weight:bold;">✗ Not Covered</p>
            <template for:each={notCoveredFields} for:item="f">
                <div key={f.label} class="slds-badge slds-m-right_xx-small slds-m-bottom_xx-small" style="background:#ffebee;color:#c62828;">{f.label}</div>
            </template>
        </template>
    </div>
</template>
```

- [ ] **Step 2: Create JS controller**

```javascript
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
```

- [ ] **Step 3: Create meta file**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__RecordPage</target>
        <target>lightning__AgentConversation</target>
    </targets>
</LightningComponentBundle>
```

- [ ] **Step 4: Deploy eraProgressTracker**

```bash
sf project deploy start --source-dir force-app/main/default/lwc/eraProgressTracker --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded.

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/lwc/eraProgressTracker/
git commit -m "feat: add eraProgressTracker agentforce messaging LWC"
```

---

## Task 8: eraFaultSelector LWC

**Files:**
- Create: `force-app/main/default/lwc/eraFaultSelector/eraFaultSelector.html`
- Create: `force-app/main/default/lwc/eraFaultSelector/eraFaultSelector.js`
- Create: `force-app/main/default/lwc/eraFaultSelector/eraFaultSelector.js-meta.xml`

- [ ] **Step 1: Create HTML**

```html
<template>
    <div class="slds-grid slds-wrap slds-gutters_small slds-p-around_small">
        <template for:each={faultTypes} for:item="ft">
            <div key={ft.value} class="slds-col slds-size_1-of-3 slds-m-bottom_small">
                <button
                    class={ft.cssClass}
                    data-value={ft.value}
                    onclick={handleSelect}
                    style="width:100%;padding:8px;border-radius:6px;border:1px solid #dddbda;cursor:pointer;">
                    {ft.label}
                </button>
            </div>
        </template>
    </div>
</template>
```

- [ ] **Step 2: Create JS**

```javascript
import { LightningElement, track, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class EraFaultSelector extends LightningElement {
    @api selectedFault = '';

    @track faultTypes = [
        { label: '🔧 Mechanical', value: 'Mechanical', cssClass: 'fault-tile' },
        { label: '🛞 Flat Tyre', value: 'Flat Tyre', cssClass: 'fault-tile' },
        { label: '⛽ Fuel', value: 'Fuel', cssClass: 'fault-tile' },
        { label: '🔑 Lockout', value: 'Lockout', cssClass: 'fault-tile' },
        { label: '⚡ EV Out of Charge', value: 'EV Out of Charge', cssClass: 'fault-tile' },
        { label: '🔥 Fire', value: 'Fire', cssClass: 'fault-tile' },
        { label: '❓ Other', value: 'Other', cssClass: 'fault-tile' },
    ];

    handleSelect(event) {
        const selected = event.currentTarget.dataset.value;
        this.selectedFault = selected;
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedFault', selected));
        this.dispatchEvent(new CustomEvent('faultselected', { detail: selected, bubbles: true, composed: true }));
    }
}
```

- [ ] **Step 3: Create meta file**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AgentConversation</target>
    </targets>
</LightningComponentBundle>
```

- [ ] **Step 4: Deploy**

```bash
sf project deploy start --source-dir force-app/main/default/lwc/eraFaultSelector --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded.

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/lwc/eraFaultSelector/
git commit -m "feat: add eraFaultSelector agentforce messaging LWC"
```

---

## Task 9: eraVehicleCard LWC

**Files:**
- Create: `force-app/main/default/lwc/eraVehicleCard/eraVehicleCard.html`
- Create: `force-app/main/default/lwc/eraVehicleCard/eraVehicleCard.js`
- Create: `force-app/main/default/lwc/eraVehicleCard/eraVehicleCard.js-meta.xml`

- [ ] **Step 1: Create HTML**

```html
<template>
    <div class="slds-card slds-p-around_small">
        <p class="slds-text-heading_small">Vehicle on File</p>
        <div class="slds-grid slds-wrap slds-m-top_small">
            <div class="slds-col slds-size_1-of-2"><b>Make:</b> {make}</div>
            <div class="slds-col slds-size_1-of-2"><b>Model:</b> {model}</div>
            <div class="slds-col slds-size_1-of-2"><b>Rego:</b> {registration}</div>
            <div class="slds-col slds-size_1-of-2"><b>Type:</b> {vehicleType}</div>
            <div class="slds-col slds-size_1-of-2"><b>Year:</b> {year}</div>
        </div>
        <div class="slds-m-top_small">
            <button class="slds-button slds-button_brand slds-m-right_small" onclick={handleConfirm}>Confirm</button>
            <button class="slds-button slds-button_neutral" onclick={handleDifferent}>Different Vehicle</button>
        </div>
    </div>
</template>
```

- [ ] **Step 2: Create JS**

```javascript
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
```

- [ ] **Step 3: Create meta file**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AgentConversation</target>
    </targets>
</LightningComponentBundle>
```

- [ ] **Step 4: Deploy**

```bash
sf project deploy start --source-dir force-app/main/default/lwc/eraVehicleCard --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded.

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/lwc/eraVehicleCard/
git commit -m "feat: add eraVehicleCard agentforce messaging LWC"
```

---

## Task 10: eraHotelResults LWC

**Files:**
- Create: `force-app/main/default/lwc/eraHotelResults/eraHotelResults.html`
- Create: `force-app/main/default/lwc/eraHotelResults/eraHotelResults.js`
- Create: `force-app/main/default/lwc/eraHotelResults/eraHotelResults.js-meta.xml`

- [ ] **Step 1: Create HTML**

```html
<template>
    <div class="slds-grid slds-wrap slds-gutters_small slds-p-around_small">
        <template for:each={hotels} for:item="hotel">
            <div key={hotel.id} class="slds-col slds-size_1-of-1 slds-medium-size_1-of-3 slds-m-bottom_small">
                <div class="slds-card slds-p-around_small" style="border:1px solid #dddbda;border-radius:6px;">
                    <p class="slds-text-heading_small">{hotel.name}</p>
                    <p class="slds-text-body_small">{hotel.address}</p>
                    <p class="slds-m-top_xx-small"><b>${hotel.rate}/night</b> · {hotel.distance}km away</p>
                    <template if:false={hotel.booking}>
                        <button class="slds-button slds-button_brand slds-m-top_small" data-id={hotel.id} onclick={handleBook}>Book</button>
                    </template>
                    <template if:true={hotel.booking}>
                        <div class="slds-m-top_small">
                            <lightning-input type="date" label="Check In" data-id={hotel.id} data-field="checkIn" onchange={handleDateChange}></lightning-input>
                            <lightning-input type="date" label="Check Out" data-id={hotel.id} data-field="checkOut" onchange={handleDateChange}></lightning-input>
                            <lightning-input type="number" label="Rooms" value="1" min="1" max="5" data-id={hotel.id} data-field="rooms" onchange={handleDateChange}></lightning-input>
                            <button class="slds-button slds-button_success slds-m-top_small" data-id={hotel.id} onclick={handleConfirmBooking}>Confirm Booking</button>
                        </div>
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>
```

- [ ] **Step 2: Create JS**

```javascript
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
```

- [ ] **Step 3: Create meta file**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AgentConversation</target>
    </targets>
</LightningComponentBundle>
```

- [ ] **Step 4: Deploy**

```bash
sf project deploy start --source-dir force-app/main/default/lwc/eraHotelResults --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded.

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/lwc/eraHotelResults/
git commit -m "feat: add eraHotelResults agentforce messaging LWC"
```

---

## Task 11: eraDispatchCard + eraBookingList Record Page LWCs

**Files:**
- Create: `force-app/main/default/lwc/eraDispatchCard/*` (3 files)
- Create: `force-app/main/default/lwc/eraBookingList/*` (3 files)

- [ ] **Step 1: Create eraDispatchCard HTML**

```html
<template>
    <lightning-card title="ERA Dispatch Summary" icon-name="standard:service_appointment">
        <div class="slds-p-around_medium">
            <div class="slds-grid slds-wrap slds-gutters">
                <div class="slds-col slds-size_1-of-2">
                    <p><b>Member:</b> {record.Member__r.Name}</p>
                    <p><b>Policy Tier:</b> {record.Product_Tier__c}</p>
                    <p><b>Policy Number:</b> {record.Policy_Number__c}</p>
                    <p><b>Vehicle:</b> {record.Vehicle__r.Name}</p>
                    <p><b>Fault Type:</b> {record.Fault_Type__c}</p>
                    <p><b>Towing Limit:</b> {record.Towing_Limit_km__c} km</p>
                </div>
                <div class="slds-col slds-size_1-of-2">
                    <p><b>Location:</b> {record.Breakdown_Location__c}</p>
                    <p><b>Distance from Home:</b> {record.Distance_From_Home__c}</p>
                    <p><b>Dispatch Restriction:</b> {record.Dispatch_Restriction__c}</p>
                    <p><b>Safety Concern:</b> {safetyConcernLabel}</p>
                    <p><b>Caravan/Trailer:</b> {caravanLabel}</p>
                    <p><b>Notes:</b> {record.Notes__c}</p>
                </div>
            </div>
            <div class="slds-m-top_small">
                <span class={statusBadgeClass}>{record.Status__c}</span>
            </div>
        </div>
    </lightning-card>
</template>
```

- [ ] **Step 2: Create eraDispatchCard JS**

```javascript
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
```

- [ ] **Step 3: Create eraDispatchCard meta**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <objects><object>ERA_Dispatch__c</object></objects>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

- [ ] **Step 4: Create eraBookingList HTML**

```html
<template>
    <lightning-card title="Accommodation Bookings" icon-name="standard:opportunity">
        <div class="slds-p-around_medium">
            <template if:true={hasBookings}>
                <table class="slds-table slds-table_cell-buffer slds-table_bordered">
                    <thead>
                        <tr>
                            <th>Booking Ref</th><th>Dispatch</th><th>Hotel</th>
                            <th>Check In</th><th>Check Out</th><th>Rooms</th>
                            <th>Total Cost</th><th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template for:each={bookings} for:item="b">
                            <tr key={b.Id}>
                                <td>{b.Name}</td>
                                <td>{b.Dispatch__r.Name}</td>
                                <td>{b.Hotel_Name__c}</td>
                                <td>{b.Check_In__c}</td>
                                <td>{b.Check_Out__c}</td>
                                <td>{b.Rooms__c}</td>
                                <td>${b.Total_Cost__c}</td>
                                <td>{b.Booking_Status__c}</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </template>
            <template if:false={hasBookings}>
                <p class="slds-text-body_small slds-text-color_weak">No accommodation bookings found.</p>
            </template>
        </div>
    </lightning-card>
</template>
```

- [ ] **Step 5: Create eraBookingList JS**

```javascript
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
```

- [ ] **Step 6: Create eraBookingList meta**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <objects><object>Account</object></objects>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

- [ ] **Step 7: Deploy both LWCs**

```bash
sf project deploy start --source-dir force-app/main/default/lwc/eraDispatchCard --source-dir force-app/main/default/lwc/eraBookingList --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded — 2 LWCs.

- [ ] **Step 8: Commit**

```bash
git add force-app/main/default/lwc/eraDispatchCard/ force-app/main/default/lwc/eraBookingList/
git commit -m "feat: add eraDispatchCard and eraBookingList record page LWCs"
```

---

## Task 12: ERA_Triage_Dispatch Agent Script

**Files:**
- Create: `force-app/main/default/aiAuthoringBundles/ERA_Triage_Dispatch/ERA_Triage_Dispatch.agent`

- [ ] **Step 1: Write the agent file**

```yaml
# ERA Triage & Dispatch Agent
# Employee Agent — OmniChannel contact center support
# Guides CSR through breakdown triage and dispatch creation

system:
    messages:
        welcome: "ERA Triage ready. Fetching member details..."
        error: "Something went wrong. Please try again or handle manually."
    instructions: |
        You assist a contact center representative who is on a live call with a member.
        Keep ALL responses to 1-2 sentences maximum, followed by one clear action.
        Never explain at length unprompted. Always state coverage limitations proactively.
        After each step invoke the eraProgressTracker component to update call status.

config:
    agent_name: "ERA_Triage_Dispatch"
    agent_label: "ERA Triage & Dispatch Agent"
    description: "Guides CSRs through ERA breakdown triage, dispatch creation, and accommodation booking"
    default_agent_user: "storm.819fe38c4c10b8@salesforce.com"

variables:
    account_id: linked string
        source: @session.recordId
        description: "Person Account ID from OmniChannel context"
    member_name: mutable string = ""
    policy_number: mutable string = ""
    product_tier: mutable string = ""
    vehicle_id: mutable string = ""
    vehicle_make: mutable string = ""
    vehicle_model: mutable string = ""
    vehicle_registration: mutable string = ""
    vehicle_type: mutable string = ""
    vehicle_year: mutable string = ""
    vehicle_confirmed: mutable boolean = False
    fault_type: mutable string = ""
    safety_concern: mutable boolean = False
    injury_details: mutable string = ""
    dispatch_restriction: mutable string = ""
    breakdown_location: mutable string = ""
    distance_from_home: mutable string = ""
    caravan_trailer: mutable boolean = False
    dispatch_id: mutable string = ""
    dispatch_name: mutable string = ""
    hotel1_name: mutable string = ""
    hotel1_address: mutable string = ""
    hotel1_rate: mutable string = ""
    hotel2_name: mutable string = ""
    hotel2_address: mutable string = ""
    hotel2_rate: mutable string = ""
    hotel3_name: mutable string = ""
    hotel3_address: mutable string = ""
    hotel3_rate: mutable string = ""
    booking_id: mutable string = ""
    booking_name: mutable string = ""
    policy_lookup_done: mutable boolean = False
    triage_complete: mutable boolean = False

start_agent entry:
    description: "Entry point — begin triage on call connect"
    reasoning:
        instructions: |
            Welcome the CSR and immediately start member verification.
        actions:
            begin_triage: @utils.transition to @subagent.era_triage
                description: "Start ERA triage flow"

subagent era_triage:
    description: "Step-by-step ERA breakdown triage — member verify, vehicle, fault, safety, location, dispatch"

    actions:
        lookup_policy:
            description: "Fetch member policy and tier from existing flow"
            inputs:
                recordId: string
                    description: "Person Account ID"
            outputs:
                policyNumber: string
                    description: "Policy number"
                productTier: string
                    description: "ERA product tier: Total Care / Extra Care / Roadside Care"
                memberName: string
                    description: "Member full name"
            target: "flow://Query_Insurance_Policies_V4"

        get_vehicle:
            description: "Fetch vehicle on file for the member"
            inputs:
                AccountId: string
                    description: "Person Account ID"
            outputs:
                VehicleId: string
                    description: "Vehicle record ID"
                VehicleMake: string
                    description: "Vehicle make"
                VehicleModel: string
                    description: "Vehicle model"
                VehicleRegistration: string
                    description: "Vehicle registration"
                VehicleType: string
                    description: "Vehicle type"
                VehicleYear: string
                    description: "Vehicle year"
            target: "flow://ERA_Get_Vehicle_Details"

        create_dispatch:
            description: "Create ERA dispatch record"
            inputs:
                MemberId: string
                    description: "Person Account ID"
                PolicyNumber: string
                    description: "Policy number"
                ProductTier: string
                    description: "Product tier"
                VehicleId: string
                    description: "Vehicle record ID"
                BreakdownLocation: string
                    description: "Breakdown location"
                DistanceFromHome: string
                    description: "Under 100km or Over 100km"
                FaultType: string
                    description: "Type of fault"
                SafetyConcern: boolean
                    description: "Whether there are safety concerns"
                InjuryDetails: string
                    description: "Injury details if any"
                DispatchRestriction: string
                    description: "Any dispatch access restrictions"
                CaravanTrailer: boolean
                    description: "Whether caravan or trailer is involved"
                Notes: string
                    description: "Additional notes"
            outputs:
                DispatchId: string
                    description: "Created dispatch record ID"
                DispatchName: string
                    description: "Dispatch reference number"
            target: "flow://ERA_Create_Dispatch"

    reasoning:
        instructions: ->
            # Step 1: Policy lookup — runs once automatically
            if @variables.policy_lookup_done == False:
                | Fetching member policy...
                set @variables.policy_lookup_done = True

            # Step 2: Show verified member and policy
            if @variables.member_name != "" and @variables.vehicle_id == "":
                | Member: {!@variables.member_name} — {!@variables.product_tier}. Fetching vehicle details.

            # Step 3: Vehicle confirmed — move to fault
            if @variables.vehicle_confirmed == True and @variables.fault_type == "":
                | Vehicle confirmed. What is the fault type?

            # Step 4: Fault type captured — safety check
            if @variables.fault_type != "" and @variables.safety_concern == False and @variables.breakdown_location == "":
                if @variables.fault_type == "Fire":
                    | Note: Fire assist covers engine bay damage only. Any injuries or safety concerns?
                if @variables.vehicle_type == "Motorcycle":
                    | Note: Motorcycle — towing and petrol only, no extended benefits. Any injuries or safety concerns?
                if @variables.fault_type != "Fire":
                    | Any injuries or safety concerns? (Yes/No)

            # Step 5: Safety done — restrictions
            if @variables.fault_type != "" and @variables.breakdown_location == "" and @variables.dispatch_restriction == "":
                | Any access restrictions at breakdown location? (e.g. car park height limit)

            # Step 6: Location
            if @variables.breakdown_location == "" and @variables.dispatch_restriction != "":
                | What is the breakdown address or suburb?

            # Step 7: Distance from home
            if @variables.breakdown_location != "" and @variables.distance_from_home == "":
                | Is the breakdown under or over 100km from the member's home address?

            # Step 8: Caravan/Trailer (Total Care only)
            if @variables.distance_from_home != "" and @variables.product_tier == "Total Care" and @variables.caravan_trailer == False and @variables.dispatch_id == "":
                | Is a caravan or trailer involved?

            # Step 9: Coverage summary before dispatch
            if @variables.distance_from_home != "" and @variables.dispatch_id == "":
                if @variables.product_tier == "Total Care":
                    | Towing covered: 100km (200km for EVs). Creating dispatch now.
                if @variables.product_tier == "Extra Care":
                    | Towing covered: 60km. Creating dispatch now.
                if @variables.product_tier == "Roadside Care":
                    | Towing covered: 20km metro / to service centre in country. Creating dispatch now.

            # Step 10: Dispatch created — route to accommodation check
            if @variables.dispatch_id != "" and @variables.triage_complete == False:
                | Dispatch {!@variables.dispatch_name} created. Checking accommodation eligibility.
                set @variables.triage_complete = True

            if @variables.triage_complete == True:
                if @variables.product_tier == "Roadside Care":
                    @utils.transition to @subagent.era_no_accommodation
                        description: "Roadside Care — no accommodation"
                if @variables.product_tier != "Roadside Care" and @variables.distance_from_home == "Under 100km":
                    @utils.transition to @subagent.era_no_accommodation
                        description: "Under 100km — no accommodation"
                if @variables.product_tier != "Roadside Care" and @variables.distance_from_home == "Over 100km":
                    @utils.transition to @subagent.era_accommodation
                        description: "Eligible for accommodation"

        actions:
            do_policy_lookup: @actions.lookup_policy
                description: "Look up member policy"
                available when @variables.policy_lookup_done == False
                with recordId = @variables.account_id
                set @variables.member_name = @outputs.memberName
                set @variables.policy_number = @outputs.policyNumber
                set @variables.product_tier = @outputs.productTier

            do_get_vehicle: @actions.get_vehicle
                description: "Get vehicle on file"
                available when @variables.member_name != "" and @variables.vehicle_id == ""
                with AccountId = @variables.account_id
                set @variables.vehicle_id = @outputs.VehicleId
                set @variables.vehicle_make = @outputs.VehicleMake
                set @variables.vehicle_model = @outputs.VehicleModel
                set @variables.vehicle_registration = @outputs.VehicleRegistration
                set @variables.vehicle_type = @outputs.VehicleType
                set @variables.vehicle_year = @outputs.VehicleYear

            set_fault_type: @utils.setVariables
                description: "CSR selected fault type from eraFaultSelector"
                with fault_type = ...

            set_safety_concern: @utils.setVariables
                description: "CSR confirmed safety concern"
                with safety_concern = ...
                with injury_details = ...

            set_restrictions: @utils.setVariables
                description: "CSR entered dispatch restrictions"
                with dispatch_restriction = ...

            set_location: @utils.setVariables
                description: "CSR entered breakdown location"
                with breakdown_location = ...

            set_distance: @utils.setVariables
                description: "CSR selected distance from home"
                with distance_from_home = ...

            set_caravan: @utils.setVariables
                description: "CSR confirmed caravan or trailer"
                with caravan_trailer = ...

            do_create_dispatch: @actions.create_dispatch
                description: "Create dispatch record"
                available when @variables.breakdown_location != "" and @variables.distance_from_home != "" and @variables.dispatch_id == ""
                with MemberId = @variables.account_id
                with PolicyNumber = @variables.policy_number
                with ProductTier = @variables.product_tier
                with VehicleId = @variables.vehicle_id
                with BreakdownLocation = @variables.breakdown_location
                with DistanceFromHome = @variables.distance_from_home
                with FaultType = @variables.fault_type
                with SafetyConcern = @variables.safety_concern
                with InjuryDetails = @variables.injury_details
                with DispatchRestriction = @variables.dispatch_restriction
                with CaravanTrailer = @variables.caravan_trailer
                with Notes = ""
                set @variables.dispatch_id = @outputs.DispatchId
                set @variables.dispatch_name = @outputs.DispatchName

subagent era_no_accommodation:
    description: "Inform CSR that accommodation is not covered — end triage"
    reasoning:
        instructions: ->
            if @variables.product_tier == "Roadside Care":
                | Accommodation not covered on Roadside Care. Triage complete — Dispatch {!@variables.dispatch_name}.
            if @variables.distance_from_home == "Under 100km":
                | Accommodation only applies over 100km from home. Triage complete — Dispatch {!@variables.dispatch_name}.

subagent era_accommodation:
    description: "Handle accommodation search and booking for eligible members"

    actions:
        search_hotels:
            description: "Search nearby hotels via mock callout"
            inputs:
                breakdownLocation: string
                    description: "Breakdown location for hotel search"
            outputs:
                isSuccess: boolean
                    description: "Whether search succeeded"
                hotel1Name: string
                    description: "Hotel 1 name"
                hotel1Address: string
                    description: "Hotel 1 address"
                hotel1NightlyRate: string
                    description: "Hotel 1 nightly rate"
                hotel1DistanceKm: string
                    description: "Hotel 1 distance km"
                hotel2Name: string
                    description: "Hotel 2 name"
                hotel2Address: string
                    description: "Hotel 2 address"
                hotel2NightlyRate: string
                    description: "Hotel 2 nightly rate"
                hotel2DistanceKm: string
                    description: "Hotel 2 distance km"
                hotel3Name: string
                    description: "Hotel 3 name"
                hotel3Address: string
                    description: "Hotel 3 address"
                hotel3NightlyRate: string
                    description: "Hotel 3 nightly rate"
                hotel3DistanceKm: string
                    description: "Hotel 3 distance km"
            target: "apex://ERA_HotelSearch"

        create_booking:
            description: "Create accommodation booking record"
            inputs:
                MemberId: string
                    description: "Person Account ID"
                DispatchId: string
                    description: "Parent dispatch ID"
                HotelName: string
                    description: "Selected hotel name"
                HotelAddress: string
                    description: "Selected hotel address"
                CheckIn: string
                    description: "Check in date"
                CheckOut: string
                    description: "Check out date"
                Rooms: string
                    description: "Number of rooms"
                NightlyRate: string
                    description: "Nightly rate"
                PolicyAllowance: string
                    description: "Policy nightly allowance"
            outputs:
                BookingId: string
                    description: "Created booking record ID"
                BookingName: string
                    description: "Booking reference number"
            target: "flow://ERA_Create_Booking"

    reasoning:
        instructions: ->
            if @variables.hotel1_name == "":
                if @variables.product_tier == "Extra Care":
                    | Policy covers up to $170/night accommodation. Searching nearby hotels.
                if @variables.product_tier == "Total Care":
                    | Policy covers up to $170/night for you and travel party. One room per booking. Searching nearby hotels.

            if @variables.hotel1_name != "" and @variables.booking_id == "":
                | 3 hotels found nearby. Select one to book.

            if @variables.booking_id != "":
                | Booking {!@variables.booking_name} confirmed. Triage and accommodation complete.

        actions:
            do_search_hotels: @actions.search_hotels
                description: "Search for nearby hotels"
                available when @variables.hotel1_name == ""
                include_in_progress_indicator: True
                progress_indicator_message: "Searching nearby hotels..."
                with breakdownLocation = @variables.breakdown_location
                set @variables.hotel1_name = @outputs.hotel1Name
                set @variables.hotel1_address = @outputs.hotel1Address
                set @variables.hotel1_rate = @outputs.hotel1NightlyRate
                set @variables.hotel2_name = @outputs.hotel2Name
                set @variables.hotel2_address = @outputs.hotel2Address
                set @variables.hotel2_rate = @outputs.hotel2NightlyRate
                set @variables.hotel3_name = @outputs.hotel3Name
                set @variables.hotel3_address = @outputs.hotel3Address
                set @variables.hotel3_rate = @outputs.hotel3NightlyRate

            do_create_booking: @actions.create_booking
                description: "Create the accommodation booking"
                available when @variables.hotel1_name != "" and @variables.booking_id == ""
                with MemberId = @variables.account_id
                with DispatchId = @variables.dispatch_id
                with HotelName = ...
                with HotelAddress = ...
                with CheckIn = ...
                with CheckOut = ...
                with Rooms = ...
                with NightlyRate = ...
                with PolicyAllowance = "170"
                set @variables.booking_id = @outputs.BookingId
                set @variables.booking_name = @outputs.BookingName
```

Save to `force-app/main/default/aiAuthoringBundles/ERA_Triage_Dispatch/ERA_Triage_Dispatch.agent`

- [ ] **Step 2: Validate agent syntax**

```bash
cd /Users/akshay.koul/WorkingFolderClaude && python3 agentforce-adlc/shared/hooks/scripts/agent-validator.py force-app/main/default/aiAuthoringBundles/ERA_Triage_Dispatch/ERA_Triage_Dispatch.agent 2>&1
```
Expected: No syntax errors or critical warnings.

- [ ] **Step 3: Deploy agent bundle**

```bash
sf project deploy start --source-dir force-app/main/default/aiAuthoringBundles --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: Deploy Succeeded — ERA_Triage_Dispatch agent.

- [ ] **Step 4: Commit**

```bash
git add force-app/main/default/aiAuthoringBundles/
git commit -m "feat: add ERA_Triage_Dispatch agent script"
```

---

## Task 13: Push All to GitHub

- [ ] **Step 1: Push all commits**

```bash
git push origin master
```
Expected: All 9 commits pushed to `https://github.com/akshaykoul/era-triage-dispatch-agent`

- [ ] **Step 2: Verify on GitHub**

```bash
gh repo view akshaykoul/era-triage-dispatch-agent
```
Expected: repo shows all files including `force-app/` and `docs/`.

---

## Task 14: Smoke Test

- [ ] **Step 1: Confirm custom objects exist in org**

```bash
sf sobject describe --sobject Vehicle__c --target-org storm.819fe38c4c10b8@salesforce.com | grep -i "name"
sf sobject describe --sobject ERA_Dispatch__c --target-org storm.819fe38c4c10b8@salesforce.com | grep -i "name"
sf sobject describe --sobject ERA_Accommodation_Booking__c --target-org storm.819fe38c4c10b8@salesforce.com | grep -i "name"
```
Expected: Each returns the object name confirming deployment.

- [ ] **Step 2: Confirm flows are active**

```bash
sf data query --query "SELECT DeveloperName, Status FROM Flow WHERE DeveloperName LIKE 'ERA_%' ORDER BY DeveloperName" --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: ERA_Create_Booking, ERA_Create_Dispatch, ERA_Get_Vehicle_Details — all Active.

- [ ] **Step 3: Confirm Apex class deployed**

```bash
sf data query --query "SELECT Name, Status FROM ApexClass WHERE Name = 'ERA_HotelSearch'" --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: ERA_HotelSearch — Active.

- [ ] **Step 4: Confirm agent deployed**

```bash
sf data query --query "SELECT DeveloperName FROM BotDefinition WHERE DeveloperName = 'ERA_Triage_Dispatch'" --target-org storm.819fe38c4c10b8@salesforce.com
```
Expected: returns 1 row.

- [ ] **Step 5: Commit smoke test results** (optional — note pass/fail in commit message)

```bash
git commit --allow-empty -m "chore: smoke test passed — all ERA components confirmed deployed"
```
