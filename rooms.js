class Rooms {
  constructor() {
    this.rooms = [];
  }

  getRooms() {
    return this.rooms;
  }

  addRoom(room) {
    this.rooms.push(room);
  }

  findRoom(room) {
    return this.rooms.indexOf(room);
  }
}

module.exports = function() {
  return new Rooms();
}