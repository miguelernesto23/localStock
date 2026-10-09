import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      omit: { userId: true, costPrice: true },
    });
    if (!products) {
      return NextResponse.json({
        success: true,
        message: "No hay productos en la tienda",
      });
    }
    return NextResponse.json({
      success: true,
      message: "Productos Encontrados",
      data: products,
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      message: error,
    });
  }
}
