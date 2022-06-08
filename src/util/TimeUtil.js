const DateDiff = require('date-diff')

class TimeUtil {
  static secondsDiff (date1, date2) {
    const dateDiff = new DateDiff(date1, date2)
    return dateDiff.seconds()
  }

  static futureDate (minutes) {
    return new Date(Date.now() + (minutes * 60 * 1000))
  }
}

module.exports = TimeUtil
