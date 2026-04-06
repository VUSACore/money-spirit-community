import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { REFERRAL_LINKS } from "@/lib/referralLinks";
import { CURRENCY_META, SUPPORTED_CURRENCIES, formatCurrency } from "@/lib/currencyMeta";

const fetchRates = async (base: string) => {
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) throw new Error("Failed to fetch rates");
  return res.json();
};

const CurrencyCalculator = () => {
  const [fromCurrency, setFromCurrency] = useState("AUD");
  const [toCurrency, setToCurrency] = useState("PHP");
  const [amount, setAmount] = useState("200");
  const [debouncedFrom, setDebouncedFrom] = useState("AUD");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFrom(fromCurrency), 300);
    return () => clearTimeout(t);
  }, [fromCurrency]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["exchange_rates", debouncedFrom],
    queryFn: () => fetchRates(debouncedFrom),
    staleTime: 5 * 60 * 1000,
  });

  const rate = data?.rates?.[toCurrency] ?? 0;
  const numAmount = parseFloat(amount) || 0;
  const converted = numAmount * rate;
  const lastUpdated = data?.time_last_update_utc;

  // Use only supported currencies that exist in API response
  const availableCurrencies = data?.rates
    ? SUPPORTED_CURRENCIES.filter((c) => c in data.rates)
    : SUPPORTED_CURRENCIES;

  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-cream p-6 my-8">
        <p className="font-body text-navy text-sm">
          Unable to load exchange rates right now. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <section className="my-12">
      <h2 className="font-heading text-2xl text-navy mb-6">Live Currency Calculator</h2>
      <div className="rounded-lg border border-border bg-white p-6 space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-gold/10" />
            <Skeleton className="h-10 w-full bg-gold/10" />
            <Skeleton className="h-12 w-48 bg-gold/10" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="font-body text-xs text-navy/60 mb-1 block">From</label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="bg-cream border-border">
                    <SelectValue>
                      {CURRENCY_META[fromCurrency]
                        ? `${CURRENCY_META[fromCurrency].flag} ${fromCurrency}`
                        : fromCurrency}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {formatCurrency(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-body text-xs text-navy/60 mb-1 block">To</label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="bg-cream border-border">
                    <SelectValue>
                      {CURRENCY_META[toCurrency]
                        ? `${CURRENCY_META[toCurrency].flag} ${toCurrency}`
                        : toCurrency}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {formatCurrency(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-body text-xs text-navy/60 mb-1 block">Amount</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-cream border-border"
                  min="0"
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="font-heading text-3xl text-gold">
                {converted.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {toCurrency}
              </p>
              <p className="font-body text-xs text-navy/60 mt-1">
                1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
              </p>
              {lastUpdated && (
                <p className="font-body text-xs text-navy/40 italic mt-0.5">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild className="bg-navy text-white hover:bg-gold hover:text-white font-body">
                <a href={REFERRAL_LINKS.wise} target="_blank" rel="noopener noreferrer">
                  Send this amount with Wise
                </a>
              </Button>
              <Button asChild className="bg-navy text-white hover:bg-gold hover:text-white font-body">
                <a href={REFERRAL_LINKS.remitly} target="_blank" rel="noopener noreferrer">
                  Send this amount with Remitly
                </a>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CurrencyCalculator;
