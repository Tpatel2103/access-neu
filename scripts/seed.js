// Fills both collections with fictional sample data: 1,200 reports and 300 spaces.
// Usage: npm run seed   (replaces any existing documents in the two collections)
import "dotenv/config";
import { insertManyReports } from "../backend/db/accessReportsDB.js";
import { closeDb, connectToDb } from "../backend/db/connection.js";
import { insertManySpaces } from "../backend/db/quietSpacesDB.js";
import {
  BUILDINGS,
  LIGHTING_TYPES,
  NOISE_LEVELS,
  REPORT_SEVERITIES,
  SPACE_FEATURES,
} from "../backend/constants.js";

const REPORT_COUNT = 1200;
const SPACE_COUNT = 300;

// Small seeded random generator so every run produces the same data.
let seed = 5610;
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (min, max) => min + Math.floor(random() * (max - min + 1));

const FLOORS = [
  "Ground floor",
  "1st floor",
  "2nd floor",
  "3rd floor",
  "4th floor",
  "Basement",
  "Main lobby",
  "",
];
const NAMES = [
  "Priya",
  "Jordan",
  "Alex",
  "Sam",
  "Wei",
  "Maya",
  "Diego",
  "Aisha",
  "Chris",
  "Lena",
  "",
];

const REPORT_TEMPLATES = {
  elevator: [
    [
      "Elevator out of service",
      "The elevator is not working. Use the elevator on the other side of the building or the connecting bridge.",
    ],
    [
      "Elevator stuck between floors",
      "The elevator stopped between floors twice today. Facilities has been notified.",
    ],
    [
      "Elevator buttons not responding",
      "Call buttons on this floor do not light up. You may need to wait for someone inside.",
    ],
  ],
  ramp: [
    [
      "Ramp blocked by delivery carts",
      "Delivery carts are parked across the ramp most mornings until about 10am.",
    ],
    [
      "Ramp handrail loose",
      "The handrail on the ramp is wobbly and not safe to lean on.",
    ],
    [
      "Ramp icy and not salted",
      "The ramp was icy this morning and has not been treated.",
    ],
  ],
  entrance: [
    [
      "Accessible entrance locked",
      "The accessible entrance was locked during posted hours. The main entrance has steps.",
    ],
    [
      "Entrance closed for construction",
      "This entrance is fenced off for construction. Follow the detour signs to the side door.",
    ],
    [
      "Card reader at entrance not working",
      "The card reader at the accessible entrance does not respond.",
    ],
  ],
  "automatic door": [
    [
      "Automatic door button broken",
      "Pressing the push plate does nothing. The door is heavy to open by hand.",
    ],
    [
      "Automatic door closes too fast",
      "The door closes before a wheelchair user can get through.",
    ],
  ],
  restroom: [
    [
      "Accessible restroom out of order",
      "The accessible stall is closed for repair. The nearest one is one floor down.",
    ],
    [
      "Accessible restroom door lock broken",
      "The lock on the single-occupancy accessible restroom does not latch.",
    ],
  ],
  pathway: [
    [
      "Sidewalk torn up near entrance",
      "Construction has removed the curb cut. The path is uneven gravel.",
    ],
    [
      "Path blocked by scooters",
      "Several scooters are parked across the walkway, leaving no clear route.",
    ],
    [
      "Puddle covering curb cut",
      "Standing water covers the whole curb cut after rain.",
    ],
  ],
  signage: [
    [
      "No signs to accessible entrance",
      "There are no signs pointing to the accessible entrance from the main door.",
    ],
    [
      "Braille room sign missing",
      "The tactile room sign next to the door is missing.",
    ],
  ],
  other: [
    [
      "Fire alarm strobe flashing constantly",
      "The strobe light in the hallway keeps flashing, which may trigger sensory issues.",
    ],
    [
      "Loud construction noise all day",
      "Drilling next door makes the area very loud from 8am to 5pm.",
    ],
  ],
};

const SPACE_TYPES = [
  ["Silent study room", "Strictly silent. Phones on vibrate."],
  [
    "Quiet reading nook",
    "A few soft chairs by the windows. Rarely crowded in the evening.",
  ],
  ["Graduate study lounge", "Mostly quiet with occasional whispering."],
  ["Group study room", "Bookable room that is quiet when used alone."],
  ["Corner carrels", "Individual desks facing the wall, good for focus."],
  ["Lounge alcove", "Soft lighting and low foot traffic after 6pm."],
  ["Sensory-friendly room", "Dimmable lights and no overhead announcements."],
];
const HOURS = [
  "Mon-Fri 8am-10pm",
  "Daily 7am-midnight",
  "24/7 with Husky Card",
  "Mon-Thu 9am-9pm, Fri 9am-5pm",
  "Daily 8am-8pm",
];

function daysAgo(days) {
  return new Date(
    Date.now() - days * 24 * 60 * 60 * 1000 - between(0, 86399) * 1000,
  );
}

function makeReport() {
  const category = pick(Object.keys(REPORT_TEMPLATES));
  const [title, description] = pick(REPORT_TEMPLATES[category]);
  const createdAt = daysAgo(between(0, 180));
  const resolved = random() < 0.6;
    const resolvedAt = resolved
    ? new Date(
        Math.min(Date.now(), createdAt.getTime() + between(1, 14) * 86400000),
      )
    : null;
  return {
    title,
    location: pick(BUILDINGS),
    floor: pick(FLOORS),
    category,
    severity: pick(REPORT_SEVERITIES),
    status: resolved ? "resolved" : "open",
    description,
    reporterName: pick(NAMES),
    createdAt,
    updatedAt: resolvedAt ?? createdAt,
    resolvedAt,
  };
}

function makeSpace() {
  const [type, notes] = pick(SPACE_TYPES);
  const building = pick(BUILDINGS);
  const floor = pick(FLOORS);
  const features = SPACE_FEATURES.filter(() => random() < 0.35);
  const createdAt = daysAgo(between(10, 365));
  return {
    name: `${building} ${type.toLowerCase()}`,
    building,
    floor,
    noiseLevel: pick(NOISE_LEVELS),
    lighting: pick(LIGHTING_TYPES),
    features,
    capacity: between(1, 60),
    hours: pick(HOURS),
    notes,
    addedBy: pick(NAMES),
    createdAt,
    updatedAt: new Date(createdAt.getTime() + between(0, 9) * 86400000),
  };
}

await connectToDb();
const reports = Array.from({ length: REPORT_COUNT }, makeReport);
const spaces = Array.from({ length: SPACE_COUNT }, makeSpace);
await insertManyReports(reports);
await insertManySpaces(spaces);
console.log(
  `Seeded ${reports.length} access reports and ${spaces.length} quiet spaces.`,
);
await closeDb();
