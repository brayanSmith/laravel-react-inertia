<?php

namespace App\Support;

/**
 * A small user-agent reader: enough to tell which browser, operating system
 * and kind of device a login came from, without pulling in a library.
 */
class UserAgent
{
    /**
     * @return array{navegador: string, sistema_operativo: string, dispositivo: string}
     */
    public static function parse(?string $userAgent): array
    {
        $ua = (string) $userAgent;

        return [
            'navegador' => self::navegador($ua),
            'sistema_operativo' => self::sistemaOperativo($ua),
            'dispositivo' => self::dispositivo($ua),
        ];
    }

    private static function navegador(string $ua): string
    {
        // Order matters: Edge and Opera also announce "Chrome", and Chrome
        // announces "Safari".
        return match (true) {
            str_contains($ua, 'Edg/') || str_contains($ua, 'Edge/') => 'Edge',
            str_contains($ua, 'OPR/') || str_contains($ua, 'Opera') => 'Opera',
            str_contains($ua, 'Firefox/') => 'Firefox',
            str_contains($ua, 'Chrome/') || str_contains($ua, 'CriOS/') => 'Chrome',
            str_contains($ua, 'Safari/') => 'Safari',
            default => 'Desconocido',
        };
    }

    private static function sistemaOperativo(string $ua): string
    {
        // Android and iOS UAs also contain "Linux" / "Mac OS X".
        return match (true) {
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'iPhone') || str_contains($ua, 'iPad') => 'iOS',
            str_contains($ua, 'Mac OS X') || str_contains($ua, 'Macintosh') => 'macOS',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'Desconocido',
        };
    }

    private static function dispositivo(string $ua): string
    {
        return match (true) {
            str_contains($ua, 'iPad') || str_contains($ua, 'Tablet') => 'Tablet',
            str_contains($ua, 'Mobi') || str_contains($ua, 'iPhone') || str_contains($ua, 'Android') => 'Móvil',
            $ua === '' => 'Desconocido',
            default => 'Escritorio',
        };
    }
}
