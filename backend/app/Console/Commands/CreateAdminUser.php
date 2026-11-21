<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create';

    protected $description = 'Create an administrator account for the dashboard';

    public function handle(): int
    {
        $name = trim($this->ask('Administrator name', 'Administrator'));
        $email = Str::lower(trim($this->ask('Administrator email')));

        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
        ], [
            'name' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:100', 'unique:users,email'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $password = $this->secret('Administrator password');
        $passwordConfirmation = $this->secret('Confirm password');
        $passwordValidator = Validator::make([
            'password' => $password,
            'password_confirmation' => $passwordConfirmation,
        ], [
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if ($passwordValidator->fails()) {
            foreach ($passwordValidator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $attributes = [
            'username' => $name,
            'email' => $email,
            'password_hash' => $password,
            'is_admin' => true,
            'created_at' => now(),
        ];

        if (Schema::hasColumn('users', 'name')) {
            $attributes['name'] = $name;
        }

        if (Schema::hasColumn('users', 'password')) {
            $attributes['password'] = $password;
        }

        User::query()->create($attributes);

        $this->info('Administrator account created.');

        return self::SUCCESS;
    }
}
