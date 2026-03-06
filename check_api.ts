
const url = "https://api.reliefweb.int/v1/reports?appname=test&limit=20&preset=latest&fields[include][]=title&fields[include][]=body&fields[include][]=date&fields[include][]=source&fields[include][]=primary_country&fields[include][]=url";
fetch(url)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
