<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InventoryTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()?->hasAnyRole(['Admin', 'Manager', 'Kitchen']);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'item_id' => ['required', 'exists:items,id'],
            'type' => ['required', 'in:in,out,adjustment,damage,expired'],
            'quantity' => ['required', 'integer'],
            'reference_type' => ['nullable', 'in:sale,purchase,manual,waste'],
            'reference_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'transaction_date' => ['required', 'date_format:Y-m-d H:i:s'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'item_id.required' => 'Please select an item',
            'item_id.exists' => 'The selected item is invalid',
            'type.required' => 'Transaction type is required',
            'type.in' => 'Invalid transaction type selected',
            'quantity.required' => 'Quantity is required',
            'quantity.integer' => 'Quantity must be a whole number',
            'transaction_date.required' => 'Transaction date is required',
            'transaction_date.date_format' => 'Transaction date format is invalid',
        ];
    }
}
