const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
require("dotenv").config();

const arg = process.argv.slice(2);

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

const extractTimesFromSheetData = (arr2D, dateRanges, database) => {
  const arrStartIndex = 6;
  const arrEndIndex = 30;
  const allShiftCells = {};

  const allInitials = database.map(({ initials, email }, i) => {
    allShiftCells[initials] = {
      initials,
      email,
      shiftCells: [],
    };

    return initials;
  });

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

      if (!allInitials.includes(cell)) {
        continue;
      }
      // if (cell !== process.env.MENTOR_INITIALS) {
      //     continue;
      // }

      const cellObj = {
        timezone: tz,
        time,
        timePST: Number(timePST),
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

const generateThisSchedulePeriod = () => {
  const currentWeek = dayjs().week();
  const delta = arg[0] ? Number(arg[0]) : 0;
  const nextMonday = dayjs()
    .week(currentWeek + delta)
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

const findAndReturnTheRightSheetName = (namedRanges) => {
  const periodDates = generateThisSchedulePeriod();
  const periodDatesArr = Object.values(periodDates);

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

module.exports = {
  createDateRangeFromSheetData,
  extractTimesFromSheetData,
  formatIntoShifts,
  findAndReturnTheRightSheetName,
  displayShifts,
};
