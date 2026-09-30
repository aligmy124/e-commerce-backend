// import { RequestHandler } from "express";
// import mongoose from "mongoose";

// export const validateObjectId: RequestHandler<{orderId: string}> = (req, res, next) => {
//   const { orderId } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(orderId)) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid order id",
//     });
//   }

//   next();
// };


import { RequestHandler } from "express";
import mongoose from "mongoose";

export const validateObjectId = (paramName: string): RequestHandler => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (typeof id !=="string" ||!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}`,
      });
    }

    next();
  };
};
