const controlLogic = (function () {
  const key = "6cfcbdbb8a65937e16e331ce7b54a06e";
  const proxy = 'https://cors-anywhere.herokuapp.com/';

  async function getByCoord(lon, lat) {
    try {
      const result = await fetch(
        `${proxy}http://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly,minutely&appid=${key}&lang=id&units=metric`
      );
      const data = await result.json();
      return data;
    } catch (error) {
      alert(error);
    }
  }

  async function getByLonLat(lon = 55.5, lat = 37.5) {
    try {
      const result = await fetch(
        `${proxy}http://api.openweathermap.org/data/2.5/weather?lon=${lon}&lat=${lat}&appid=${key}&units=metric`);
      const data = await result.json()
      // const tomorrow = data.consolidated_weather[1];
      return data;
    } catch (error) {
      alert(error);
    }
  }
  async function getBySearch(city = 'london') {
    try {
      const result = await fetch(
        `${proxy}http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric`);

      if (result.status !== 200) {
        const notif = document.querySelector('.notification')
        alert(result.statusText)
        notif.textContent = 'Location ' + result.status + ' ' + result.statusText;
        notif.style.background = 'red'
        return
      }
      const data = await result.json()
      // const tomorrow = data.consolidated_weather[1];
      return data;
    } catch (error) {
      alert(error);
    }
  }

  let data = {}
  return {
    getBySearch: async function (city) {
      let state = {}
      let data = await getBySearch(city)
      state = await { ...state, name: data.name, ...data.sys }
      let store = await getByCoord(data.coord.lon, data.coord.lat)
      state = await { ...state, ...store }
      return state
    },
    getByLonLat: async function (lon, lat) {
      let state = {}
      let data = await getByLonLat(lon, lat)
      state = await { ...state, name: data.name, ...data.sys }
      let store = await getByCoord(data.coord.lon, data.coord.lat)
      state = await { ...state, ...store }
      return state
    }
    ,
    getData: function () {
      return data
    }
  }
})();

const controlUI = (function () {
  const notification = document.querySelector('.notification')
  const header = document.getElementById('header');
  const suhu = document.querySelector('.weather-suhu');
  const image = document.querySelector('.weather-icon');
  const detail = document.querySelector('.detail-temp');
  const dayli = document.querySelector('.dayli');
  const listDay = document.querySelector('.list-day');

  const notif = function (params = { message: 'Successful' }) {
    notification.textContent = params.message
    notification.style.background = '#eb6e4b'
    if (params.message !== 'Successful') {
      notification.style.background = 'red'
    }
  }

  const timeDate = function (dt) {
    const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    let time = new Date(dt * 1000)
    let timeDay = {
      hh: time.getHours() > 9 ? time.getHours() : '0' + time.getHours(),
      mm: time.getMinutes() > 9 ? time.getMinutes() : '0' + time.getMinutes(),
      day: day[time.getDay()]
    }
    return timeDay
  }

  const displayHeader = function (data, dt) {
    const date = timeDate(dt)

    header.innerHTML = `<p style="color: #eb6e4b; font-size: 14px;">${date.day} ${date.hh}:${date.mm}</p>
    <div style="font-size: 24px;">${data.name}, ${data.country}</div>
    <p style="color: #878787;">${data.weather[0].description}</p>`
  }

  const displayDetail = function (data) {
    suhu.innerHTML = `${data.temp.day}<sup style="font-size: 24px; color: #eb6e4b;">°C`
    image.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
    detail.innerHTML = `<p><i class="wi wi-wind-direction"></i> ${data.wind_speed}m/s | <i class="wi wi-barometer"></i> ${data.pressure}hPa | <i class="wi wi-humidity"></i> ${data.humidity}% | UV: ${data.uvi} | <strong>Sunrise:</strong> ${timeDate(data.sunrise).hh}:${timeDate(data.sunrise).mm} | <strong>Sunset:</strong> ${timeDate(data.sunset).hh}:${timeDate(data.sunset).mm}</p>`
    let dayParts = {
      day: 'Afternoon',
      eve: 'Evening',
      morn: 'Morning',
      night: 'Night'
    }

    let likely = '<div class="day"><p>&nbsp;</p><p>Temperature:</p><p>Feel Like:</p></div>'
    for (const like in data.feels_like) {
      likely = likely + `<div class="day"><p>${dayParts[like]}</p><p>${data.temp[like]}°c</p><p>${data.feels_like[like]}°c</p></div>`
    }
    dayli.innerHTML = likely
  }

  const displayDaily = function (datas) {
    let data = [...datas]
    let strings = ''
    data.map(function (item, index) {
      strings = strings + `<div data-index=${index} class="card-day">
      <p>${timeDate(item.dt).day}</p>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png">
      <p><span>${item.temp.max}°</span> <span style="color: #dfe1e5;">${item.temp.min}°</span></p>
    </div>`
    })
    listDay.innerHTML = strings
  }

  const activeCard = function (indeks) {
    const cardDay = document.querySelectorAll('.card-day');
    for (let i = 0; i < cardDay.length; i++) {
      if (cardDay[i].getAttribute('data-index') === indeks) {
        cardDay[i].classList.add('active')
      } else {
        cardDay[i].classList.remove('active')
      }
    }
  }
  const displayUi = function (data) {
    let dataKota = { name: data.name, country: data.country }
    let dataDaily = [...data.daily]
    let dataSelected = dataDaily[0]
    displayHeader({ ...dataKota, weather: dataSelected.weather }, dataSelected.dt)
    displayDetail(dataSelected)
    displayDaily(dataDaily)
    activeCard('0')

    return function selectData(event) {
      const cd = event.target.closest('.card-day')
      let dataIndex = 0
      dataIndex = cd.getAttribute('data-index')
      dataSelected = dataDaily[dataIndex]
      activeCard(dataIndex)
      displayHeader({ ...dataKota, weather: dataSelected.weather }, dataSelected.dt)
      displayDetail(dataSelected)
    }
  }

  return {
    notif: notif,
    displayUi: displayUi
  }
})();

const appControl = (function (ui, logic) {
  const setEven = function () {
    const btnLocation = document.querySelector('.btn-coord');
    const btnInput = document.querySelector('.btn-input')
    btnLocation.addEventListener('click', setLocation)
    btnInput.addEventListener('click', setInput)
  }

  const changeDay = function (fn) {
    const cardDay = document.querySelectorAll('.card-day')
    for (let i = 0; i < cardDay.length; i++) {
      cardDay[i].addEventListener('click', fn)
    }
  }

  const getData = async function (type, datas) {
    if (type === "geo") {
      const data = await logic.getByLonLat(datas.longitude, datas.latitude)
      const dataUI = ui.displayUi(data)
      changeDay(dataUI)
    } else {
      const data = await logic.getBySearch(datas.message)
      const dataUI = ui.displayUi(data)
      ui.notif({ message: 'Successful' })
      changeDay(dataUI)
    }
  }

  const setLocation = function () {
    if (!navigator.geolocation) {
      ui.notif({ message: 'Geolocation is not supported by your browser' })
    } else {
      ui.notif({ message: 'Locating…' })
      navigator.geolocation.getCurrentPosition(function (data) {
        ui.notif()
        getData("geo", data.coords)
      },
        function (data) {
          ui.notif(data)
        })
    }
  }

  const setInput = function () {
    const inputVal = document.getElementById('city')
    if (inputVal.value !== "") {
      getData("city", { message: inputVal.value })
    }
    ui.notif({ message: "Must Be Filled Out" })
  }

  return {
    init: async function () {
      console.log("applikasi berjalan")
      setEven()
      // let store = await logic.getBySearch()
      // console.log(store)
    }
  }
})(controlUI, controlLogic);
appControl.init()

const key = "6cfcbdbb8a65937e16e331ce7b54a06e";
