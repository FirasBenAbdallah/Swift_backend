
const mongoose = require("mongoose");
const { schema, model } = mongoose;
module.exports = {
const publication2 = new schema(
  {
    name: {
      type: String,
    },
    address: {
      type: String,
    },
    start: {
      type: String,
    },
    end: {
      type: String,
    },
    description: {
      type: String,
    },
/*     pde: {
      type: String,
    }, */
  },
/*   {
    timestamps: true,
  } */
);

};
