import { v2 as cloudinary} from "cloudinary"
import { env } from "./env"

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_secret: env.CLOUDINARY_API_SECRET,
    api_key: env.CLOUDINARY_API_KEY
});

export default cloudinary