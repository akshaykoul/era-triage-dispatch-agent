# ERA Triage & Dispatch Agent — Design Spec
**Date:** 2026-04-30  
**Project:** RACV Emergency Roadside Assistance — Agentforce Employee Agent  
**Org:** storm.819fe38c4c10b8@salesforce.com

---

## 1. Overview

An Agentforce Employee Agent named **"ERA Triage & Dispatch Agent"** embedded in the OmniChannel screen. Activated when a contact center call comes in. Guides the Contact Service Rep (CSR) through capturing all required breakdown incident details, creates a Dispatch record, checks accommodation eligibility based on policy tier and distance, searches for nearby hotels via a mock callout, and creates an Accommodation Booking record. All responses are brief (1-2 sentences + action) to suit a live call context.

---

## 2. Architecture

```
OmniChannel Screen (CSR)
│
├── Agentforce Chat Panel
│   ├── ERA_Triage_Dispatch.agent
│   │   ├── Topic: ERA_Triage
│   │   └── Topic: ERA_Accommodation
│   └── LWC Messaging Components (inline in chat)
│       ├── eraProgressTracker
│       ├── eraFaultSelector
│       ├── eraVehicleCard
│       └── eraHotelResults
│
├── Salesforce Data
│   ├── Person Account (existing)
│   ├── Vehicle__c (new, related to Account)
│   ├── ERA_Dispatch__c (new, related to Account)
│   └── ERA_Accommodation_Booking__c (new, related to Account + Dispatch)
│
├── Flows
│   ├── Query Insurance Policies -V4 (existing)
│   ├── ERA_Get_Vehicle_Details (new)
│   ├── ERA_Create_Dispatch (new)
│   └── ERA_Create_Booking (new)
│
├── Apex
│   └── ERA_Hotel_Search (new — mock HTTP callout)
│
└── Record Page LWCs
    ├── eraDispatchCard (on ERA_Dispatch__c page)
    └── eraBookingList (on Person Account page)
```

---

## 3. Data Model

### 3.1 Vehicle__c
Related to: `Account` (Person Account)

| Field | Type | Notes |
|---|---|---|
| `Name` | Auto | Auto-number |
| `Account__c` | Lookup(Account) | Person Account |
| `Make__c` | Text(100) | e.g. Toyota |
| `Model__c` | Text(100) | e.g. Camry |
| `Registration__c` | Text(20) | e.g. ABC123 |
| `Vehicle_Type__c` | Picklist | Car / Motorcycle / EV / Caravan / Trailer |
| `Year__c` | Number(4) | e.g. 2021 |

Sample data: 3 Vehicle records per demo Person Account.

### 3.2 ERA_Dispatch__c
Related to: `Account` (Person Account)

| Field | Type | Notes |
|---|---|---|
| `Name` | Auto | Dispatch reference number |
| `Member__c` | Lookup(Account) | Caller's Person Account |
| `Policy_Number__c` | Text(50) | From policy flow |
| `Product_Tier__c` | Picklist | Total Care / Extra Care / Roadside Care |
| `Vehicle__c` | Lookup(Vehicle__c) | Confirmed vehicle |
| `Breakdown_Location__c` | Text(255) | Address / suburb |
| `Distance_From_Home__c` | Picklist | Under 100km / Over 100km |
| `Fault_Type__c` | Picklist | Mechanical / Flat Tyre / Fuel / Lockout / EV Out of Charge / Fire / Other |
| `Safety_Concern__c` | Checkbox | Default false |
| `Injury_Details__c` | Text Area(500) | Only populated if safety concern = true |
| `Dispatch_Restriction__c` | Text(255) | e.g. "Car park, 2.1m height limit" |
| `Caravan_Trailer__c` | Checkbox | Only applicable for Total Care |
| `Status__c` | Picklist | Draft / Submitted / Dispatched |
| `Towing_Limit_km__c` | Formula(Number) | IF(Product_Tier__c = 'Total Care', 100, IF(Product_Tier__c = 'Extra Care', 60, 20)) |
| `Notes__c` | Text Area(1000) | Additional CSR notes |

### 3.3 ERA_Accommodation_Booking__c
Related to: `Account`, `ERA_Dispatch__c`

| Field | Type | Notes |
|---|---|---|
| `Name` | Auto | Booking reference number |
| `Member__c` | Lookup(Account) | Caller's Person Account |
| `Dispatch__c` | Lookup(ERA_Dispatch__c) | Parent dispatch incident |
| `Hotel_Name__c` | Text(200) | From mock API |
| `Hotel_Address__c` | Text(255) | From mock API |
| `Check_In__c` | Date | CSR entered |
| `Check_Out__c` | Date | CSR entered |
| `Rooms__c` | Number(2,0) | Default 1 |
| `Nightly_Rate__c` | Currency | From mock API |
| `Total_Cost__c` | Formula(Currency) | `Nightly_Rate__c * (Check_Out__c - Check_In__c)` |
| `Policy_Allowance__c` | Currency | Populated by `ERA_Create_Booking` flow from policy tier: 170 (Total/Extra Care), 0 (Roadside Care) |
| `Booking_Status__c` | Picklist | Pending / Confirmed / Cancelled |

---

## 4. Agent: ERA_Triage_Dispatch.agent

### Agent-level Instructions
- You are assisting a contact center representative who is on a live call. Keep all responses to 1-2 sentences maximum followed by one clear action or question.
- Never provide lengthy explanations unprompted. If the rep needs detail, they will ask.
- Always state coverage limitations proactively — do not wait to be asked.
- After each step, re-render the `eraProgressTracker` component showing captured fields (green), pending required fields (amber), and ineligible benefits (red).

### 4.1 Topic: ERA_Triage

**Trigger:** Call connects in OmniChannel with a Person Account in context.

**Steps:**

1. **Member Verify**
   - Invoke `Query Insurance Policies -V4` with caller Account ID.
   - Render result: member name + policy tier in chat.
   - No CSR input needed.

2. **Vehicle Confirm**
   - Invoke `ERA_Get_Vehicle_Details` flow.
   - If vehicle found: render `eraVehicleCard` LWC with Make/Model/Rego + "Confirm" / "Different Vehicle" buttons.
   - If not found: prompt CSR to enter Make, Model, Rego, Type, Year. Create `Vehicle__c` record.

3. **Fault Type**
   - Render `eraFaultSelector` LWC: clickable tiles — Mechanical / Flat Tyre / Fuel / Lockout / EV Out of Charge / Fire / Other.
   - On Fire selection: agent adds note — *"Fire assist only covers engine bay damage."*
   - On Motorcycle vehicle type: agent adds note — *"Motorcycle: towing and petrol only. No extended benefits."*

4. **Safety Check**
   - Render Yes/No buttons: "Any injuries or safety concerns?"
   - If Yes: inline text field appears for injury details.

5. **Dispatch Restrictions**
   - Render Yes/No buttons: "Any access restrictions at breakdown location?"
   - If Yes: inline text field — e.g. "Car park, 2.1m height limit", "Narrow road", "Beach/off-road" (note: off-road is excluded from coverage — agent flags this).

6. **Breakdown Location**
   - Text input field for address/suburb.

7. **Distance from Home**
   - Render clickable buttons: "Under 100km" / "Over 100km".

8. **Caravan / Trailer** *(Total Care only)*
   - Render Yes/No buttons.
   - If Extra Care or Roadside Care and CSR asks: *"Caravan/trailer assist not covered on this tier."*

9. **Coverage Summary**
   - Agent states towing limit for tier:
     - Total Care: *"100km towing covered (200km for EVs)."*
     - Extra Care: *"60km towing covered."*
     - Roadside Care: *"20km towing covered in metro. Country: to attending service centre only."*
   - `eraProgressTracker` refreshes — all captured fields green, any skipped amber.

10. **Create Dispatch**
    - Invoke `ERA_Create_Dispatch` flow.
    - Agent displays: *"Dispatch [reference] created. Proceeding to accommodation check."*

### 4.2 Topic: ERA_Accommodation

**Trigger:** Automatically follows ERA_Triage if: Product_Tier__c ≠ Roadside Care AND Distance_From_Home__c = "Over 100km".

**Eligibility Guardrails (checked before any hotel search):**

| Condition | Agent Response |
|---|---|
| Roadside Care | "Accommodation not covered on Roadside Care." — topic ends |
| Under 100km (any tier) | "Accommodation only applies when breakdown is over 100km from home." — topic ends |
| Extra Care eligible | "Policy covers up to $170/night accommodation." |
| Total Care eligible | "Policy covers up to $170/night accommodation for you and your travel party." |

**Steps:**

1. **Eligibility Confirm** — state allowance per above table.

2. **Multi-room Question** *(if asked)*
   - Agent looks up T&Cs: *"Policy covers one room per night. Total Care includes your travel party in the same booking."*

3. **Hotel Search**
   - Invoke `ERA_Hotel_Search` Apex with breakdown location.
   - Render `eraHotelResults` LWC: 3 hotel cards, each showing name, address, nightly rate, "Book" button.

4. **Booking**
   - CSR clicks Book on a hotel card.
   - Inline date picker (check-in / check-out) + rooms field appear.
   - Invoke `ERA_Create_Booking` flow.
   - Agent confirms: *"Booking [reference] created. Check-in [date], [n] nights."*

5. **Progress Tracker refresh** — booking appears green.

---

## 5. Coverage Rules Reference (built into agent instructions)

| Scenario | Rule |
|---|---|
| Roadside Care + accommodation | Not covered |
| Any tier + under 100km + accommodation | Not covered |
| Motorcycle | Towing + petrol only, no extended benefits |
| Fire damage | Engine bay only |
| EV out of charge (Total Care) | 200km tow to nearest charging station |
| Caravan/Trailer (Extra Care / Roadside Care) | Not covered |
| Off-road / beach / creek bed breakdown | Not covered |
| Annual benefit caps | Total Care $15k / Extra Care $10k / Roadside Care $5k |

---

## 6. Flows

### ERA_Get_Vehicle_Details
- Input: `AccountId` (text)
- Query `Vehicle__c` WHERE `Account__c = AccountId` LIMIT 1
- Output: `Vehicle_Make`, `Vehicle_Model`, `Vehicle_Registration`, `Vehicle_Type`, `Vehicle_Year`, `VehicleId`

### ERA_Create_Dispatch
- Input: all `ERA_Dispatch__c` field values
- Create `ERA_Dispatch__c` record
- Output: `DispatchId`, `DispatchName` (reference number)

### ERA_Create_Booking
- Input: all `ERA_Accommodation_Booking__c` field values
- Create `ERA_Accommodation_Booking__c` record
- Output: `BookingId`, `BookingName` (reference number)

---

## 7. Apex: ERA_Hotel_Search

Mock HTTP callout class. Returns 3 hardcoded hotel results regardless of location (for demo). Implements `Callable` interface so it can be invoked as an Agent Action.

**Input:** `breakdownLocation` (String)  
**Output:** List of 3 hotels, each with: `hotelName`, `hotelAddress`, `nightlyRate` (Decimal), `distanceKm` (Integer)

Mock data:
```
1. Comfort Inn Melbourne CBD — 123 Collins St, Melbourne — $145/night — 2km
2. Quest Serviced Apartments — 45 Swanston St, Melbourne — $160/night — 3km
3. Holiday Inn Express — 789 Bourke St, Melbourne — $135/night — 1km
```

---

## 8. LWC Components

### 8.1 eraProgressTracker *(Agentforce messaging component)*
- Renders after each agent step
- Three sections: **Captured** (green), **Pending** (amber), **Not Covered** (red)
- Fields: Member, Policy Tier, Vehicle, Fault Type, Safety, Restrictions, Location, Distance, Towing Limit, Dispatch Ref, Accommodation Eligibility, Booking Ref

### 8.2 eraFaultSelector *(Agentforce messaging component)*
- Clickable tile grid: Mechanical / Flat Tyre / Fuel / Lockout / EV Out of Charge / Fire / Other
- Single select; posts selection back to agent as text

### 8.3 eraVehicleCard *(Agentforce messaging component)*
- Shows: Make, Model, Rego, Type, Year
- Two action buttons: "Confirm" / "Different Vehicle"

### 8.4 eraHotelResults *(Agentforce messaging component)*
- Three hotel cards side-by-side
- Each card: Hotel Name, Address, Distance, Nightly Rate, "Book" button
- On Book click: inline date picker + rooms selector appears within card

### 8.5 eraDispatchCard *(Record page — ERA_Dispatch__c)*
- Full dispatch summary: member, policy, vehicle, fault, location, restrictions, safety, status
- Status badge (Draft / Submitted / Dispatched)

### 8.6 eraBookingList *(Record page — Person Account)*
- List of all `ERA_Accommodation_Booking__c` records for the account
- Columns: Booking Ref, Dispatch Ref, Hotel, Check-in, Check-out, Rooms, Total Cost, Status
- Filterable by dispatch incident

---

## 9. Out of Scope (v1)
- Real hotel booking API integration (placeholder mock only)
- External dispatch/CAD system integration
- SMS/notification to field technician
- Returning member to collect repaired vehicle (transport claim flow)
- Travel party recovery transport (hospitalisation/death benefits)

---

## 10. Open Questions
- None — all resolved during design session.
