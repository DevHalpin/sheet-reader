const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
require("dotenv").config();

dayjs.extend(weekOfYear);

const createDateRangeFromSheetData = (dateArr) => {
  const dateRanges = ["", ""];
  let currentDate = "";

  for (let i = 2; i < dateArr.length; ++i) {
    const currentCell = dateArr[i];

    if (currentCell.length > 0) {
      currentDate = currentCell;
    }
    dateRanges.push(currentDate);
  }

  return dateRanges;
};

const extractTimesFromSheetData = (arr2D, dateRanges, initials, tzDelta) => {
  const arrStartIndex = 6;
  const arrEndIndex = 30;
  const allShiftCells = {};

  allShiftCells[initials] = {
    initials,
    shiftCells: [],
  };

  for (let y = arrStartIndex; y < arrEndIndex; ++y) {
    const row = arr2D[y];
    let timePST = "";
    let time = "";
    let tz = "";
    for (let x = 0; x < row.length; ++x) {
      const cell = row[x];

      if (x === 0) {
        time = cell;
        tz = cell.split(" ")[1];
        continue;
      }

      if (x === 1) {
        timePST = cell;
        continue;
      }

      if (cell !== initials) {
        continue;
      }

      const cellObj = {
        timezone: tz,
        time,
        timePST: tzDelta !== 0 ? Number(timePST)+tzDelta :Number(timePST),
        day: dateRanges[x],
      };
      allShiftCells[cell].shiftCells.push(cellObj);
    }
  }

  return allShiftCells;
};

const formatIntoShifts = (shiftCells) => {
  shiftCells.sort((a, b) => a.timePST < b.timePST);
  
  const groupedShifts = {};
  const parsedShifts = [];
  
  for (const shiftCell of shiftCells) {
    if (!groupedShifts[shiftCell.day]) {
      groupedShifts[shiftCell.day] = [];
    }
    groupedShifts[shiftCell.day].push(shiftCell);
  }
  for (const day in groupedShifts) {
    let startTime = groupedShifts[day][0].timePST;
    let endTime;
    let currentDay = day;
    for (const time of groupedShifts[day]) {
      if (time.timePST === startTime) {
        endTime = startTime + 1;
      } else if (time.timePST === endTime) {
        endTime += 1;
      } else {
        if (!endTime) {
          endTime = startTime + 1;
        }
        parsedShifts.push({
          startTime: startTime > 12 ? startTime - 12 : startTime,
          startPeriod: startTime >= 12 ? "pm" : "am",
          endTime: endTime > 12 ? endTime - 12 : endTime,
          endPeriod: endTime >= 12 ? "pm" : "am",
          day: currentDay,
        });
        startTime = time.timePST;
        endTime = startTime + 1;
      }
    }
    if (!endTime) {
      endTime = startTime + 1;
    }
    parsedShifts.push({
      startTime: startTime > 12 ? startTime - 12 : startTime,
      startPeriod: startTime >= 12 ? "pm" : "am",
      endTime: endTime > 12 ? endTime - 12 : endTime,
      endPeriod: endTime >= 12 ? "pm" : "am",
      day: currentDay,
    });
  }
  const compare = (a, b) => {
    if (a.day < b.day) {
      return -1;
    }
    if (a.day > b.day) {
      return 1;
    }
    return 0;
  };
  parsedShifts.sort(compare);
  
  return parsedShifts;
};

const processSheetData = async (data, user, tzDelta) => {
  const delta = tzDelta ? Number(tzDelta) : 0;
  const sheetDates = data[0];
  const dateRanges = createDateRangeFromSheetData(sheetDates);
  const allShiftCells = extractTimesFromSheetData(data, dateRanges, user, delta);
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
const generateThisSchedulePeriod = (delta) => {
  const currentWeek = dayjs().week();

  const nextMonday = dayjs()
    .week(currentWeek + Number(delta))
    .day(1);
  const nextSunday = nextMonday.add(6, "day");

  return {
    startDay: nextMonday.format("D"),
    startMonth: nextMonday.format("MMM"),
    startYear: nextMonday.format("YYYY"),
    endDay: nextSunday.format("D"),
    endMonth: nextSunday.format("MMM"),
  };
};

const findAndReturnTheRightSheetName = (namedRanges, range) => {
  const delta = range ? range : 0;
  const periodDates = generateThisSchedulePeriod(delta);
  const periodDatesArr = Object.values(periodDates);

  console.log(`Date range provided: ${periodDatesArr[1]} ${periodDatesArr[0]} ${periodDatesArr[2]} - ${periodDatesArr[4]} ${periodDatesArr[3]} ${periodDatesArr[2]}`)

  for (const range of namedRanges) {
    const rangeName = range.name;
    let foundAllNames = true;

    for (const dateVal of periodDatesArr) {
      if (!rangeName.includes(dateVal)) {
        foundAllNames = false;
        break;
      }
    }

    if (!foundAllNames) {
      continue;
    }

    return rangeName.split("!")[0]; // get rid of any sheets commands in name
  }
};

const displayShifts = (shifts) => {
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
};

const convertTime = (time, period) => {
  if (period.toLowerCase() === 'pm') {
    if (time < 12) {
      return time + 12;
    }
  }
  return time;
}

const getMonthFromString = (monthString) => {
  const d = Date.parse(monthString + "1, 2022");
  if(!isNaN(d)) {
    return new Date(d).getMonth() + 1;
  }
  return -1;
}

const buildCalendarEventBody = (shift, eventSummary) => {
  const dayInfo = shift.day.split(' ');
  const dayMonth = dayInfo[0].split('-');
  const day = dayMonth[0];
  const month = getMonthFromString(dayMonth[1]);
  const year = dayInfo[1];

  const start = convertTime(shift.startTime, shift.startPeriod);
  const end = convertTime(shift.endTime, shift.endPeriod);
  const tutoringStartDate = new Date(year, month - 1, Number(day), Number(start), 0, 0, 0);
  const tutoringEndDate = new Date(year, month - 1, Number(day), Number(end), 0, 0, 0);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    summary: eventSummary,
    description: eventSummary,
    start: {
      dateTime: tutoringStartDate,
      timeZone,
    },
    end: {
      dateTime: tutoringEndDate,
      timeZone,
    },
    reminders: {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 7},
      ],
    }
  }
}

module.exports = {
  createDateRangeFromSheetData,
  extractTimesFromSheetData,
  formatIntoShifts,
  findAndReturnTheRightSheetName,
  displayShifts,
  processSheetData,
  convertTime,
  getMonthFromString,
  buildEventBody: buildCalendarEventBody,
};
