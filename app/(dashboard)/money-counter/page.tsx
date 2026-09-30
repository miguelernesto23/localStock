"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "motion/react";

import { Banknote, Calculator, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const denominations = [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5];

export default function MoneyCounterPage() {
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  function updateQuantity(denomination: number, value: string) {
    const quantity = Number(value);

    setQuantities((current) => ({
      ...current,
      [denomination]:
        Number.isFinite(quantity) && quantity >= 0 ? Math.floor(quantity) : 0,
    }));
  }

  function clearCounter() {
    setQuantities({});
  }

  const total = useMemo(() => {
    return denominations.reduce(
      (sum, denomination) =>
        sum + denomination * (quantities[denomination] ?? 0),
      0,
    );
  }, [quantities]);

  const totalPieces = useMemo(() => {
    return denominations.reduce(
      (sum, denomination) => sum + (quantities[denomination] ?? 0),
      0,
    );
  }, [quantities]);

  function formatCurrency(value: number) {
    return `${value.toLocaleString("es-CU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} CUP`;
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      {/* =========================
          Header
      ========================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: -15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
        }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          {/* Breadcrumb */}

          <motion.div
            initial={{
              opacity: 0,
              x: -10,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.35,
              delay: 0.05,
            }}
            className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Calculator className="h-4 w-4" />

            <span>Herramientas</span>

            <span>/</span>

            <span>Contador de dinero</span>
          </motion.div>

          {/* Título */}

          <motion.h1
            initial={{
              opacity: 0,
              x: -10,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.1,
            }}
            className="text-3xl font-bold tracking-tight"
          >
            Contador de dinero
          </motion.h1>

          {/* Descripción */}

          <motion.p
            initial={{
              opacity: 0,
              x: -10,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.15,
            }}
            className="text-muted-foreground"
          >
            Cuenta tu efectivo por denominación.
          </motion.p>
        </div>

        {/* Limpiar */}

        <AnimatePresence>
          {totalPieces > 0 && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                x: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                x: 10,
              }}
              transition={{
                duration: 0.2,
              }}
            >
              <motion.div
                whileHover={{
                  scale: 1.03,
                }}
                whileTap={{
                  scale: 0.97,
                }}
              >
                <Button variant="outline" onClick={clearCounter}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* =========================
          Card principal
      ========================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.15,
          ease: "easeOut",
        }}
      >
        <Card className="overflow-hidden">
          {/* Header */}

          <CardHeader className="border-b bg-muted/30">
            <motion.div
              initial={{
                opacity: 0,
                x: -10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.35,
                delay: 0.25,
              }}
            >
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  initial={{
                    scale: 0.7,
                    rotate: -15,
                  }}
                  animate={{
                    scale: 1,
                    rotate: 0,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: 0.3,
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <Banknote className="h-5 w-5" />
                </motion.div>
                Efectivo
              </CardTitle>
            </motion.div>
          </CardHeader>

          <CardContent className="p-0">
            {/* =========================
                Encabezado de tabla
            ========================== */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.3,
                delay: 0.3,
              }}
              className="hidden grid-cols-[1fr_180px_180px] border-b bg-muted/20 px-6 py-3 text-sm font-medium text-muted-foreground sm:grid"
            >
              <span>Denominación</span>

              <span>Cantidad</span>

              <span className="text-right">Subtotal</span>
            </motion.div>

            {/* =========================
                Denominaciones
            ========================== */}

            <div className="max-h-[40vh] divide-y overflow-auto">
              {denominations.map((denomination, index) => {
                const quantity = quantities[denomination] ?? 0;

                const subtotal = denomination * quantity;

                return (
                  <motion.div
                    key={denomination}
                    initial={{
                      opacity: 0,
                      x: -15,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      duration: 0.3,
                      delay: 0.25 + index * 0.045,
                      ease: "easeOut",
                    }}
                    whileHover={{
                      backgroundColor: "var(--muted)",
                    }}
                    className="grid gap-3 px-6 py-4 transition-colors sm:grid-cols-[1fr_180px_180px] sm:items-center"
                  >
                    {/* Denominación */}

                    <div>
                      <motion.p
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          duration: 0.25,
                        }}
                        className="font-semibold"
                      >
                        {formatCurrency(denomination)}
                      </motion.p>

                      {/* Subtotal móvil */}

                      <div className="text-xs text-muted-foreground sm:hidden">
                        Subtotal:{" "}
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={subtotal}
                            initial={{
                              opacity: 0,
                              y: 4,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: -4,
                            }}
                            transition={{
                              duration: 0.15,
                            }}
                          >
                            {formatCurrency(subtotal)}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Cantidad */}

                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={quantity === 0 ? "" : quantity}
                        onChange={(event) =>
                          updateQuantity(denomination, event.target.value)
                        }
                        placeholder="0"
                        className="h-10 transition-shadow focus-visible:ring-2"
                      />
                    </div>

                    {/* Subtotal */}

                    <div className="hidden text-right font-medium sm:block">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={subtotal}
                          initial={{
                            opacity: 0,
                            y: 5,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -5,
                          }}
                          transition={{
                            duration: 0.15,
                          }}
                        >
                          {formatCurrency(subtotal)}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* =========================
                Resumen
            ========================== */}

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.35,
                delay: 0.25 + denominations.length * 0.045,
              }}
              className="border-t bg-muted/20 p-6"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                {/* Cantidad de piezas */}

                <div>
                  <p className="text-sm text-muted-foreground">
                    Cantidad de billetes/monedas
                  </p>

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={totalPieces}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -8,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className="text-2xl font-semibold"
                    >
                      {totalPieces}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Total */}

                <div className="sm:text-right">
                  <p className="text-sm text-muted-foreground">Total contado</p>

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={total}
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className="text-4xl font-bold tracking-tight"
                    >
                      {formatCurrency(total)}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
