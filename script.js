"use strict";

// data classes
// parent class has mutual data of all workouts
class Workout {
    date = new Date();
    id = Date.now();
    constructor(coords, distance, duration) {
        this.coords = coords; // [lat, lng]
        this.distance = distance; // km
        this.duration = duration; // min
    }
    _setDescription() {
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        // show in HTML as "Running || Cycling on monthName dayDate e.g(Running || Cycling on February 12)"
        this.description = `${
            this.type[0].toUpperCase() + this.type.slice(1)
        } on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}
// own data of running type workout "inherits class Workout"
class Running extends Workout {
    type = "running";
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
// own data of cycling type workout "inherits class Workout"
class Cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
// HTML Elements
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const btnRemoveAll = document.querySelector(".remove-all");
const alertMessage = document.querySelector(".message-overlay");
const message = document.querySelector(".message--text");
// application functionality
class APP {
    #map;
    #mapEvent;
    #workouts = [];
    #zoomLevel = 10;
    constructor() {
        // get current position
        this._getPosition();
        // get workouts data from local storage
        this._getDataFromLocalStorage();
        // event handlers
        btnRemoveAll.addEventListener("click", this.clearLocalStorage);
        inputType.addEventListener("change", this._toggleFields);
        form.addEventListener("submit", this._newWorout.bind(this));
        containerWorkouts.addEventListener(
            "click",
            this._moveToWorkout.bind(this)
        );
        document.addEventListener("click", this.closeAlert);
    }
    _getPosition() {
        // geolocation API
        if (navigator.geolocation) {
            // get the current position
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                this._showAlert
            );
        }
    }
    // callback functions "handlers geolocations"
    //// callback function in case "location is found"
    _loadMap(position) {
        // get coords from position
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        const coords = [latitude, longitude];
        // get a map using leaflet
        this.#map = L.map("map").setView(coords, this.#zoomLevel);
        L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);
        // on click a location on the map show form
        this.#map.on("click", this._showForm.bind(this));
        // show markers of saved data after map loading
        this.#workouts.forEach((workout) => {
            this._renderWorkoutMarker(workout);
        });
    }
    //// in case if "location is not found"
    _showAlert() {
        alertMessage.classList.remove("hidden");
        message.textContent = "Couldn't get your location!";
    }
    // on click certin location on map get location details "#mapEvent" && show form
    _showForm(e) {
        this.#mapEvent = e;
        // show form
        form.classList.remove("hidden");
        // make foucs on distance input
        inputDistance.focus();
    }
    // set all form input fields to empty string on submit && hide form
    _emptyForm() {
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                "";
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(() => (form.style.display = "grid"), 1000);
    }
    // on change type of workout toggle fields "cadenc && elevation"
    _toggleFields() {
        inputCadence
            .closest(".form__row")
            .classList.toggle("form__row--hidden");
        inputElevation
            .closest(".form__row")
            .classList.toggle("form__row--hidden");
    }
    // on form submit "by clicking Enter" make marker on the selected location
    _newWorout(e) {
        e.preventDefault();
        // get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        // helper functions
        const validInputs = (...inputs) =>
            inputs.every((inp) => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every((inp) => inp > 0);
        // check data
        if (type === "running") {
            const cadence = +inputCadence.value;
            // if data isn't valid
            if (
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return this._showInvalidMessage();
            // if data is valid
            workout = new Running([lat, lng], distance, duration, cadence);
            console.log(workout);
        }
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            // if data isn't valid
            if (
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)
            )
                return this._showInvalidMessage();
            // if data is valid
            workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        // add workout object to workouts array
        this.#workouts.push(workout);
        // show workout in list
        this._renderWorkout(workout);
        // show marker
        this._renderWorkoutMarker(workout);
        // empty all form inputs
        this._emptyForm();
        // add data to local storage
        this._addDataToLocalStorage();
    }
    // show invalid data message
    _showInvalidMessage() {
        alertMessage.classList.remove("hidden");
        message.textContent = "Inputs have to be positive numbers!";
    }
    // show the workout marker on the map
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 300,
                    minWidth: 150,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(
                `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${
                    workout.description
                }`
            )
            .openPopup();
    }
    // show the current workout as item in a list
    _renderWorkout(workout) {
        let html = `<li class="workout workout--${workout.type}" data-id="${
            workout.id
        }">
        <span class="remove-workout">&times;</span>
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
            <span class="workout__icon"> ${
                workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            } 
            </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
        </div>`;
        if (workout.type === "running") {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
        </div>
        </li>`;
        }
        if (workout.type === "cycling") {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
        </div>
        </li>`;
        }
        form.insertAdjacentHTML("afterend", html);
    }
    // onclick one of workouts list items move to workout marker on map
    _moveToWorkout(e) {
        this._removeWorkout(e);
        const clickedWorkout = e.target.closest(".workout");
        if (!clickedWorkout) return;
        const workout = this.#workouts.find(
            (work) => work.id == clickedWorkout.dataset.id
        );
        this.#map.setView(workout.coords, this.#zoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });
    }
    // add all workouts "array of workouts" to localstorage
    _addDataToLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }
    // get workouts data from localstorage && render all workouts
    _getDataFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem("workouts"));
        if (!data) return;
        this.#workouts = data;
        this.#workouts.forEach((workout) => {
            this._renderWorkout(workout);
        });
    }
    clearLocalStorage() {
        localStorage.removeItem("workouts");
        location.reload();
    }
    closeAlert(e) {
        if (e.target.classList.contains("close-message"))
            alertMessage.classList.add("hidden");
    }
    // onclick remove workout 
    _removeWorkout(e) {
        if (e.target.classList.contains("remove-workout")) {
            // get index of workout in workouts array
            const workoutToRemove = this.#workouts.findIndex(
                (workout) => workout.id === +e.target.parentElement.dataset.id
            );
            // remove this workout item from the array
            this.#workouts.splice(workoutToRemove, 1);
            // update local storage 
            this._addDataToLocalStorage();
            // reload page
            location.reload();
        }
    }
}
const app = new APP();
