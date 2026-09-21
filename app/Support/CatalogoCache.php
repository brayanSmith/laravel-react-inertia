<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Short-lived cache for the big product/stock listings many users open at
 * once (the POS catalog, the stock per bodega, the cotizador). They are
 * shared by every user, and they are dropped as soon as any stock, product
 * or bodega changes (see AppServiceProvider), so what people see is never
 * stale after a sale, a purchase or an edit. The TTL is only a safety net.
 */
final class CatalogoCache
{
    private const TTL_SECONDS = 600;

    private const VERSION_KEY = 'catalogo:version';

    /**
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    public static function remember(string $key, Closure $callback): mixed
    {
        return Cache::remember(self::key($key), self::TTL_SECONDS, $callback);
    }

    /**
     * Invalidate every cached listing at once (one write): the version is
     * part of each key, so the old entries just stop being read.
     */
    public static function flush(): void
    {
        Cache::forever(self::VERSION_KEY, (string) Str::uuid());
    }

    private static function key(string $key): string
    {
        return 'catalogo:'.Cache::get(self::VERSION_KEY, '0').':'.$key;
    }
}
