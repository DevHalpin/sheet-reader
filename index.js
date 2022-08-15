require("dotenv").config();
const { google } = require("googleapis");
const {
  findAndReturnTheRightSheetName,
  createDateRangeFromSheetData,
  extractTimesFromSheetData,
  formatIntoShifts,
} = require("./helpers");

const processSheetData = async (data) => {
  const usersDB = [
    {
      initials: "DAH",
    },
  ];
  const sheetDates = data[0];
  const dateRanges = createDateRangeFromSheetData(sheetDates);
  const allShiftCells = extractTimesFromSheetData(data, dateRanges, usersDB);
  const allShiftsArr = Object.values(allShiftCells);

  const shiftsPerPerson = [];

  for (const person of allShiftsArr) {
    const shifts = formatIntoShifts(person.shiftCells);

    shiftsPerPerson.push({
      person: person.initials,
      shifts,
    });
  }

  return shiftsPerPerson;
};

const getSpreadSheetData = async () => {
  try {
    const response = await sheetsAPI.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      fields: "namedRanges",
    });
    const namedRanges = response.data.namedRanges;
    sheetName = findAndReturnTheRightSheetName(namedRanges);

    // console.log("sheetName", sheetName);
    if (!sheetName) {
      console.log("Error: No sheet data found for this date range!");
      return;
    }
    const result = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: sheetName,
      majorDimension: "ROWS",
    });
    const shifts = await processSheetData(result.data.values);
    for (const shift of shifts) {
      console.log(
        `\nShifts for the week of ${sheetName} for ${shift.person}:\n--------`
      );
      for (const times of shift.shifts) {
        console.log(
          `Day: ${times.day}\nShift: ${times.startTime}${times.startPeriod} - ${times.endTime}${times.endPeriod}\n`
        );
      }
    }
  } catch (err) {
    console.log("err", err);
  }
};

const authenticate = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "./schedule-358603-bad10ba30c5d.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const authClient = await auth.getClient();

  sheetsAPI = google.sheets({
    version: "v4",
    auth: authClient,
  });

  await getSpreadSheetData();
};

if (process.env.NODE_ENV === "dev") {
  authenticate();
}
