import { NextRequest, NextResponse } from "next/server";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/types/HTTPStauts";
import * as Yup from "yup";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { IUserPayload } from "@/types/user";
import { handleValidationError } from "../../APIHelpers";
import { IAddressCreateSchema } from "@/types/address";
import { DateTime, Duration, Interval, Info, Settings } from "luxon";

const addressSchema: Yup.Schema<IAddressCreateSchema> = Yup.object().shape({
  city: Yup.string().required(),
  fullAddress: Yup.string().required(),
  coordinate: Yup.string().optional(),
  timezone: Yup.string().required(),
  restaurant_fk: Yup.number().required(),
});

const restaurantExist = async (id: number): Promise<boolean> => {
  const rest = await prisma.restaurant.findFirst({
    where: {
      id,
    },
  });

  if (rest) return true;
  return false;
};
export const createAddress = async (req: NextRequest) => {
  try {
    const token =
      req.cookies.get("jwt_token")?.value ||
      req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      //   return NextResponse.redirect(new URL("api/login", req.url));
      return NextResponse.json(
        { error: ERROR_MESSAGES.BAD_AUTHORIZED },
        {
          status: HTTP_STATUS.UNAUTHORIZED,
        }
      );
    }
    // вытаскиваем и проверяем jwt
    const { id, username, email, type } = jwt.verify(
      token,
      process.env.JWT_SECRET || ""
    ) as IUserPayload;
    // проверка на роль пользователя
    if (type !== "admin") {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.BAD_AUTHORIZED + " Insufficient access rights",
        },
        {
          status: HTTP_STATUS.UNAUTHORIZED,
        }
      );
    }
    // получение данных из тела запроса
    const body: IAddressCreateSchema = await req.json();
    // валидируем полученные данные
    const validAddress = await addressSchema.validate(body);
    if (!(await restaurantExist(validAddress.restaurant_fk))) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BAD_ARGUMENTS },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    // создаем новый адресс привязывая к конкретному ресторану
    const newAddress = await prisma.address.create({
      data: {
        city: validAddress.city,
        fullAddress: validAddress.fullAddress,
        coordinate: validAddress.coordinate,
        timezone: validAddress.timezone,
        restaurant: {
          connect: {
            id: validAddress.restaurant_fk,
          },
        },
      },
    });

    return NextResponse.json(newAddress, { status: HTTP_STATUS.OK });
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return handleValidationError(error);
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNEXPECTED_ERROR },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
  }
};
