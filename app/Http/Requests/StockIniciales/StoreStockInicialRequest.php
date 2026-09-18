<?php

namespace App\Http\Requests\StockIniciales;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreStockInicialRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'producto_id' => ['required', 'integer', 'exists:productos,id'],
            'bodega_id' => ['required', 'integer', 'exists:bodegas,id'],
            'cantidad' => ['required', 'integer', 'min:0'],
        ];
    }
}
