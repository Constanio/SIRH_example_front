<script setup>
import { ref, reactive, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import {
    ShieldCheck,
    ArrowRight,
    Loader2,
    Eye,
    EyeOff,
    Sparkles,
    Building2,
    Users,
    Clock,
    CheckCircle2,
} from "lucide-vue-next";

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);
const showPassword = ref(false);
const rememberMe = ref(false);
const focusedField = ref(null);
const auth = useAuthStore();
const router = useRouter();

// Stats dynamiques pour le côté droit
const stats = reactive([
    { icon: Users, label: "Utilisateurs actifs", value: 12453, suffix: "+" },
    { icon: Building2, label: "Entreprises", value: 847, suffix: "" },
    { icon: Clock, label: "Heures économisées", value: 12480, suffix: "h" },
]);

const handleLogin = async () => {
    if (!email.value || !password.value) {
        error.value = "Veuillez remplir tous les champs";
        return;
    }

    isLoading.value = true;
    error.value = "";

    // Simuler un délai pour une meilleure UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
        const success = await auth.login(email.value, password.value);
        if (success) {
            router.push("/dashboard");
        } else {
            error.value = "Email ou mot de passe incorrect";
        }
    } catch (err) {
        error.value = "Une erreur est survenue. Veuillez réessayer.";
    } finally {
        isLoading.value = false;
    }
};

const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

const getInputClass = (fieldName) => {
    return `w-full px-4 py-3.5 bg-white border-2 rounded-xl transition-all duration-200 outline-none placeholder:text-slate-400
    ${
        focusedField.value === fieldName
            ? "border-indigo-500 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50"
            : "border-slate-200 hover:border-slate-300"
    }`;
};
</script>

<template>
    <div
        class="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-['Inter']"
    >
        <!-- Left side: Login Form -->
        <div
            class="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12"
        >
            <div class="max-w-md w-full">
                <!-- Logo & Header -->
                <div class="mb-10 text-center lg:text-left">
                    <div
                        class="inline-flex items-center gap-3 mb-6 group cursor-pointer"
                    >
                        <div class="relative">
                            <div
                                class="absolute inset-0 bg-indigo-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"
                            ></div>
                            <div
                                class="relative w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl"
                            >
                                <ShieldCheck class="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <span
                            class="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent"
                        >
                            SIRH Flow
                        </span>
                    </div>

                    <h1
                        class="text-4xl lg:text-5xl font-bold text-slate-900 mb-3"
                    >
                        Bienvenue
                        <span
                            class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                        >
                            back
                        </span>
                    </h1>
                    <p class="text-slate-500 text-lg">
                        Connectez-vous pour accéder à votre espace de travail
                    </p>
                </div>

                <!-- Login Form -->
                <form class="space-y-5" @submit.prevent="handleLogin">
                    <!-- Email Field -->
                    <div class="space-y-2">
                        <label
                            class="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2"
                        >
                            <span>Adresse e-mail</span>
                            <span class="text-xs font-normal text-slate-400"
                                >(professionnelle)</span
                            >
                        </label>
                        <div class="relative">
                            <input
                                v-model="email"
                                type="email"
                                required
                                :class="getInputClass('email')"
                                placeholder="nom@entreprise.com"
                                @focus="focusedField = 'email'"
                                @blur="focusedField = null"
                            />
                            <div
                                v-if="email && email.includes('@')"
                                class="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <CheckCircle2 class="w-5 h-5 text-green-500" />
                            </div>
                        </div>
                    </div>

                    <!-- Password Field -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center ml-1">
                            <label class="text-sm font-semibold text-slate-700"
                                >Mot de passe</label
                            >
                            <a
                                href="#"
                                class="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                Mot de passe oublié ?
                            </a>
                        </div>
                        <div class="relative">
                            <input
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                required
                                :class="getInputClass('password')"
                                placeholder="Entrez votre mot de passe"
                                @focus="focusedField = 'password'"
                                @blur="focusedField = null"
                            />
                            <button
                                type="button"
                                @click="togglePassword"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <Eye v-if="!showPassword" class="w-5 h-5" />
                                <EyeOff v-else class="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <!-- Remember Me & Demo Credentials -->
                    <div class="flex items-center justify-between">
                        <label
                            class="flex items-center gap-2 cursor-pointer group"
                        >
                            <div class="relative">
                                <input
                                    type="checkbox"
                                    v-model="rememberMe"
                                    class="sr-only peer"
                                />
                                <div
                                    class="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all"
                                ></div>
                                <CheckCircle2
                                    v-if="rememberMe"
                                    class="absolute top-0 left-0 w-5 h-5 text-white pointer-events-none"
                                />
                            </div>
                            <span
                                class="text-sm text-slate-600 group-hover:text-slate-800 transition-colors"
                                >Se souvenir de moi</span
                            >
                        </label>

                        <div class="text-xs text-slate-400">
                            <span class="font-mono"
                                >demo@example.com / demo123</span
                            >
                        </div>
                    </div>

                    <!-- Error Message -->
                    <div
                        v-if="error"
                        class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm font-medium animate-shake"
                    >
                        <div class="flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{{ error }}</span>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button
                        type="submit"
                        :disabled="isLoading"
                        class="relative w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 hover:from-indigo-600 hover:to-indigo-700 transform transition-all duration-300 hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
                    >
                        <div
                            class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        ></div>
                        <Loader2
                            v-if="isLoading"
                            class="w-5 h-5 animate-spin relative z-10"
                        />
                        <template v-else>
                            <span class="relative z-10">Se connecter</span>
                            <ArrowRight
                                class="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform"
                            />
                        </template>
                    </button>
                </form>

                <!-- Footer -->
                <div class="mt-10 pt-6 border-t border-slate-200">
                    <p class="text-center text-sm text-slate-500">
                        Plateforme sécurisée · Conforme RGPD
                        <br />
                        <span class="text-xs font-mono text-slate-400"
                            >SIRH Flow v2.0</span
                        >
                    </p>
                </div>
            </div>
        </div>

        <!-- Right side: Enhanced Visual with Stats -->
        <div
            class="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 relative overflow-hidden items-center justify-center"
        >
            <!-- Animated Background Elements -->
            <div class="absolute inset-0 opacity-30">
                <div
                    class="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse"
                ></div>
                <div
                    class="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"
                ></div>
                <div
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse delay-2000"
                ></div>
            </div>

            <!-- Floating Particles -->
            <div class="absolute inset-0 overflow-hidden">
                <div
                    v-for="i in 20"
                    :key="i"
                    class="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
                    :style="{
                        left: Math.random() * 100 + '%',
                        top: Math.random() * 100 + '%',
                        animationDelay: Math.random() * 5 + 's',
                        animationDuration: 3 + Math.random() * 4 + 's',
                    }"
                ></div>
            </div>

            <!-- Main Content -->
            <div class="relative z-10 p-12 text-center max-w-2xl">
                <!-- Badge -->
                <div
                    class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20"
                >
                    <Sparkles class="w-4 h-4 text-yellow-400" />
                    <span class="text-white/90 text-sm font-medium"
                        >Nouvelle plateforme RH</span
                    >
                </div>

                <!-- Main Message -->
                <h2 class="text-5xl font-bold text-white mb-6 leading-tight">
                    Gérez vos talents
                    <span
                        class="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    >
                        simplement.
                    </span>
                </h2>

                <p class="text-indigo-100 text-lg mb-12 leading-relaxed">
                    Simplifiez la gestion de vos ressources humaines avec une
                    plateforme intuitive, puissante et sécurisée.
                </p>

                <!-- Stats Grid -->
                <div class="grid grid-cols-3 gap-6 mb-12">
                    <div
                        v-for="stat in stats"
                        :key="stat.label"
                        class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                    >
                        <component
                            :is="stat.icon"
                            class="w-8 h-8 text-indigo-400 mx-auto mb-3 group-hover:scale-110 transition-transform"
                        />
                        <div class="text-2xl font-bold text-white mb-1">
                            {{ stat.value.toLocaleString() }}{{ stat.suffix }}
                        </div>
                        <div class="text-xs text-indigo-200">
                            {{ stat.label }}
                        </div>
                    </div>
                </div>

                <!-- Testimonial -->
                <div
                    class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                >
                    <div class="flex items-center gap-2 mb-3 justify-center">
                        <div class="flex text-yellow-400">
                            <span v-for="star in 5" :key="star">★</span>
                        </div>
                    </div>
                    <p class="text-white/80 text-sm italic">
                        "La meilleure décision RH de l'année. Une interface
                        moderne et une équipe réactive."
                    </p>
                    <p class="text-indigo-300 text-xs mt-3">
                        — Sophie Martin, Directrice RH
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes shake {
    0%,
    100% {
        transform: translateX(0);
    }
    25% {
        transform: translateX(-5px);
    }
    75% {
        transform: translateX(5px);
    }
}

@keyframes float {
    0%,
    100% {
        transform: translateY(0) translateX(0);
        opacity: 0;
    }
    50% {
        transform: translateY(-20px) translateX(10px);
        opacity: 1;
    }
}

.animate-shake {
    animation: shake 0.3s ease-in-out 0s 2;
}

.animate-float {
    animation: float linear infinite;
}

/* Améliorations responsive */
@media (max-width: 1024px) {
    .min-h-screen {
        min-height: 100vh;
        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    }
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>
