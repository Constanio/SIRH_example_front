<script setup>
import { computed, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import {
    ShieldCheck,
    ArrowRight,
    Loader2,
    Mail,
    Lock,
    Eye,
    EyeOff,
} from "lucide-vue-next";

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);
const showPassword = ref(false);
const rememberMe = ref(true);

const auth = useAuthStore();
const router = useRouter();

const isFormValid = computed(() => {
    return Boolean(email.value?.trim()) && Boolean(password.value);
});

const handleLogin = async () => {
    if (!email.value || !password.value) {
        error.value = "Champs requis";
        return;
    }
    isLoading.value = true;
    error.value = "";
    try {
        const success = await auth.login(email.value, password.value, rememberMe.value);
        if (success) router.push("/dashboard");
        else error.value = "Identifiants invalides";
    } catch (err) {
        error.value = "Erreur serveur";
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div
        class="min-h-screen bg-[#020617] flex items-center justify-center p-4 sm:p-6 font-['Inter',sans-serif] selection:bg-indigo-500/30 overflow-hidden relative"
    >
        <!-- Background Decorative Elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <!-- Grid Pattern -->
            <div 
                class="absolute inset-0 opacity-[0.03]" 
                style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 32px 32px;"
            ></div>
            
            <!-- Animated Glows -->
            <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
            <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" style="animation-delay: 2s;"></div>
        </div>

        <div class="w-full max-w-[420px] relative z-10">
            <!-- Branding -->
            <div class="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div
                    class="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl mb-4 shadow-[0_0_20px_rgba(79,70,229,0.4)] rotate-3 hover:rotate-0 transition-transform duration-500"
                >
                    <ShieldCheck
                        class="w-6 h-6 text-white"
                    />
                </div>
                <h1
                    class="text-2xl font-extrabold text-white tracking-tight"
                >
                    SIRH <span class="text-indigo-400">FLOW</span>
                </h1>
                <p
                    class="text-slate-400 text-xs mt-2 font-medium tracking-[0.2em] uppercase"
                >
                    Système de Gestion Intégré
                </p>
            </div>

            <!-- Main Card -->
            <div
                class="bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-slate-800/50 shadow-2xl relative group overflow-hidden"
            >
                <!-- Subtle border glow on hover -->
                <div class="absolute inset-0 border border-indigo-500/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div class="relative">
                    <div class="mb-8">
                        <h2 class="text-xl font-semibold text-white">Ravi de vous revoir</h2>
                        <p class="text-slate-400 text-sm mt-1">Veuillez entrer vos accès pour continuer.</p>
                    </div>

                    <form
                        @submit.prevent="handleLogin"
                        class="space-y-5"
                    >
                        <!-- Email Field -->
                        <div class="space-y-2">
                            <label
                                class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1"
                            >Adresse Email</label>
                            <div class="relative group/input">
                                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail class="h-4 w-4 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    v-model="email"
                                    type="email"
                                    required
                                    placeholder="nom@entreprise.com"
                                    class="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                />
                            </div>
                        </div>

                        <!-- Password Field -->
                        <div class="space-y-2">
                            <div class="flex justify-between items-center px-1">
                                <label
                                    class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                                >Mot de passe</label>
                                <a
                                    href="#"
                                    class="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                                >Oublié ?</a>
                            </div>
                            <div class="relative group/input">
                                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock class="h-4 w-4 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    v-model="password"
                                    :type="showPassword ? 'text' : 'password'"
                                    required
                                    placeholder="••••••••"
                                    class="w-full pl-11 pr-12 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                />
                                <button
                                    type="button"
                                    @click="showPassword = !showPassword"
                                    :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-200 transition-colors"
                                >
                                    <Eye v-if="!showPassword" class="w-4 h-4" />
                                    <EyeOff v-else class="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <!-- Options -->
                        <div class="flex items-center justify-between px-1">
                            <label class="inline-flex items-center gap-2 text-xs font-medium text-slate-400 select-none cursor-pointer">
                                <input
                                    v-model="rememberMe"
                                    type="checkbox"
                                    class="h-4 w-4 rounded border-slate-700 bg-slate-950/40 text-indigo-500 focus:ring-indigo-500/30"
                                />
                                Se souvenir de moi
                            </label>
                            <div class="text-[11px] font-semibold text-slate-500">
                                Accès sécurisé
                            </div>
                        </div>

                        <!-- Error Message -->
                        <transition name="fade">
                            <div
                                v-if="error"
                                class="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-400 animate-shake"
                            >
                                <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                {{ error }}
                            </div>
                        </transition>

                        <!-- Submit Button -->
                        <button
                            type="submit"
                            :disabled="isLoading"
                            class="w-full group relative overflow-hidden bg-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-[0_4px_20px_rgba(79,70,229,0.3)]"
                        >
                            <div class="relative z-10 flex items-center justify-center gap-2">
                                <Loader2
                                    v-if="isLoading"
                                    class="w-4 h-4 animate-spin"
                                />
                                <template v-else>
                                    <span>{{ isFormValid ? "Se connecter" : "Complétez vos accès" }}</span>
                                    <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </template>
                            </div>
                            <!-- Shine effect -->
                            <div class="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        </button>
                    </form>
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-8 text-center space-y-6 animate-in fade-in duration-1000 delay-300">
                <p class="text-slate-500 text-xs font-medium">
                    En vous connectant, vous acceptez nos 
                    <a href="#" class="text-slate-400 hover:text-indigo-400 underline underline-offset-4 transition-colors">Conditions d'utilisation</a>
                </p>
                
                <div class="flex items-center justify-center gap-6">
                    <div class="h-px w-8 bg-slate-800"></div>
                    <div class="flex gap-4">
                        <div class="w-2 h-2 rounded-full bg-slate-800"></div>
                        <div class="w-2 h-2 rounded-full bg-slate-800"></div>
                        <div class="w-2 h-2 rounded-full bg-slate-800"></div>
                    </div>
                    <div class="h-px w-8 bg-slate-800"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
}

.animate-shake {
    animation: shake 0.3s ease-in-out;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Custom classes if tailwind-animate is not installed */
.animate-in {
    animation-duration: 0.5s;
    animation-fill-mode: forwards;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideInFromBottom {
    from { transform: translateY(1rem); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.fade-in { animation-name: fadeIn; }
.slide-in-from-bottom-4 { animation-name: slideInFromBottom; }

::-webkit-scrollbar {
    width: 4px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: #1e293b;
    border-radius: 10px;
}
</style>