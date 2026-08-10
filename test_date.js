function formatJoinDate(joinDate) {
  let formattedJoinDate = joinDate;
  if (formattedJoinDate) {
    // Handle DD/MM/YYYY or similar Excel text export
    const parts = formattedJoinDate.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD/MM/YYYY
        formattedJoinDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (parts[0].length === 4) {
        // YYYY-MM-DD
        formattedJoinDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }
  return formattedJoinDate;
}

console.log(formatJoinDate('21/07/2021'));
console.log(formatJoinDate('2021-07-21'));
console.log(formatJoinDate('1/5/2021'));
console.log(formatJoinDate('2021/07/21'));
