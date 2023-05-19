const publication2 = require("../schema/publicqtionRoutes.js");
const multer = require("multer");
// image uploads needs :
module.exports = {
  init(app) {
    const router = express.Router();
    let filename = "";
    const mystorage = multer.diskStorage({
      destination: "./uploads",
      filename: (req, file, redirect) => {
        let date = Date.now();
        let f1 = date + "." + file.mimetype.split("/")[1];
        redirect(null, f1);
        filename = f1;
      },
    });
    const upload = multer({ storage: mystorage });

    // Route GET pour obtenir toutes les publications
    router.get("/getpub", async (req, res) => {
      try {
        const publications = await publication2.find();
        res.send({ status: "success", message: JSON.stringify(publications) });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Route POST pour créer une nouvelle publication
    router.post("/", upload.any("imageprod"), async (req, res) => {
      const publication = new publication2({
        name: req.body.name,
        address: req.body.address,
        start: req.body.start,
        end: req.body.end,
        description: req.body.description,
        pde: req.params.pde,
      });

      try {
        publication.pde = filename;
        filename = "";
        const newPublication = await publication.save();
        res.status(201).json(newPublication);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });

    app.use("/contacts", router);
  },
};
