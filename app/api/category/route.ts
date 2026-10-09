import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        products: true,
      },
    });
    if (!categories) {
      return NextResponse.json({
        success: true,
        message: "No hay productos en la tienda",
      });
    }
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error al consultar las categorías:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudieron obtener las categorías.",
      },
      { status: 500 },
    );
  }
}
