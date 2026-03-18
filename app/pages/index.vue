<template>
  <div class="app-landing">
    <section class="app-landing__hero">
      <div class="app-landing__hero-copy fade-up fade-up-1">
        <p class="app-landing__eyebrow">Chiaro · prodotto di chiarezza per forfettario</p>
        <h1 class="app-landing__title">
          Non spendere soldi che non sono davvero tuoi.
        </h1>
        <p class="app-landing__lead">
          Chiaro ti mostra ogni mese quanto hai incassato, quanto devi accantonare e quanto resta
          davvero disponibile. Una sola lettura, senza rumore, per chi lavora a reddito variabile
          e vuole vedere il denaro come davvero si muove.
        </p>

        <div class="app-landing__actions">
          <UButton to="/login" size="lg" color="primary" class="ui-action-button">
            Continua con Google
          </UButton>
          <UButton to="/pricing" size="lg" variant="soft" color="neutral" class="ui-action-button">
            Guarda i piani
          </UButton>
        </div>
      </div>

      <SurfaceCard variant="gradient" padding="lg" class="app-landing__panel fade-up fade-up-2">
        <div class="ui-form-stack">
          <div class="ui-kv-row">
            <span class="ui-kv-row__label">Promessa</span>
            <span class="ui-kv-row__value text-[var(--text-primary)]">Mensile, chiaro, usabile</span>
          </div>
          <div class="ui-kv-row">
            <span class="ui-kv-row__label">Focus</span>
            <span class="ui-kv-row__value text-[var(--accent-text)]">Disponibile reale</span>
          </div>
          <div class="ui-kv-row">
            <span class="ui-kv-row__label">Metodo</span>
            <span class="ui-kv-row__value text-[var(--warning)]">Incassato → accantonato → disponibile</span>
          </div>
          <div class="ui-kv-row">
            <span class="ui-kv-row__label">Tempo di setup</span>
            <span class="ui-kv-row__value text-[var(--text-primary)]">Meno di un minuto</span>
          </div>
        </div>
      </SurfaceCard>
    </section>

    <div class="app-landing__metric-grid fade-up fade-up-2">
      <DecisionMetric
        label="Incassato"
        value="Quello che entra"
        note="La base concreta del mese. Chiaro non la confonde con il denaro spendibile."
        tone="default"
        compact
      />
      <DecisionMetric
        label="Da accantonare"
        value="Quello che non tocchi"
        note="Imposte, contributi e costi distribuiti prima di guardare il saldo."
        tone="danger"
        compact
      />
      <DecisionMetric
        label="Disponibile reale"
        value="Quello che puoi usare"
        note="Il numero decisionale: quanto resta davvero dopo il modello fiscale."
        tone="accent"
        compact
      />
    </div>

    <section id="come-funziona" class="app-landing__section fade-up fade-up-2">
      <div>
        <p class="app-landing__eyebrow">Come funziona</p>
        <h2 class="app-landing__section-title">Tre passaggi e il controllo mensile è leggibile.</h2>
        <p class="app-landing__section-copy">
          Non è un gestionale completo. È il layer che trasforma il fatturato in decisione
          mensile: prima capisci, poi accantoni, poi spendi il resto con fiducia.
        </p>
      </div>

      <div class="app-grid-3">
        <SurfaceCard variant="soft" padding="md">
          <p class="label-xs">1. Imposta il profilo</p>
          <p class="app-page-copy mt-3">
            ATECO, coefficiente, INPS e costi fissi entrano nel modello una sola volta.
          </p>
        </SurfaceCard>

        <SurfaceCard variant="soft" padding="md">
          <p class="label-xs">2. Registra gli incassi</p>
          <p class="app-page-copy mt-3">
            Ogni incasso aggiorna il mese, il netto e la quota da accantonare in tempo reale.
          </p>
        </SurfaceCard>

        <SurfaceCard variant="soft" padding="md">
          <p class="label-xs">3. Leggi il disponibile</p>
          <p class="app-page-copy mt-3">
            Vedi subito cosa resta davvero tuo e quali scadenze stanno arrivando.
          </p>
        </SurfaceCard>
      </div>
    </section>

    <section class="app-landing__section fade-up fade-up-2">
      <div>
        <p class="app-landing__eyebrow">Perché esiste</p>
        <h2 class="app-landing__section-title">Il problema non è il conto. È confondere il saldo con il tuo denaro.</h2>
        <p class="app-landing__section-copy">
          Il freelance in forfettario non ha bisogno di più numeri. Ha bisogno di meno incertezza:
          sapere cosa può spendere oggi senza rubare a tasse, contributi e scadenze future.
        </p>
      </div>

      <div class="app-grid-2">
        <SurfaceCard padding="lg">
          <p class="label-xs">Relief</p>
          <h3 class="font-display text-2xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
            Un controllo mensile che abbassa il rumore.
          </h3>
          <p class="app-page-copy mt-3">
            Il prodotto è costruito per il rituale mensile, non per la contabilità totale.
          </p>
        </SurfaceCard>

        <SurfaceCard padding="lg">
          <p class="label-xs">Trust</p>
          <h3 class="font-display text-2xl leading-none tracking-[-0.04em] text-[var(--text-primary)] mt-3">
            Numeri spiegabili, non solo mostrati.
          </h3>
          <p class="app-page-copy mt-3">
            Ogni numero importante ha una spiegazione leggibile, in italiano e senza gergo da studio.
          </p>
        </SurfaceCard>
      </div>
    </section>

    <section id="prezzi" class="app-landing__section fade-up fade-up-2">
      <div>
        <p class="app-landing__eyebrow">Prezzi</p>
        <h2 class="app-landing__section-title">Tre piani, una promessa sola.</h2>
        <p class="app-landing__section-copy">
          Core è il piano consigliato. Planning aggiunge scenario ed export. Free resta una
          dimostrazione utile, non un vicolo cieco.
        </p>
      </div>

      <div class="app-landing__price-grid">
        <SurfaceCard padding="lg" class="app-landing__price-card">
          <p class="label-xs">Free</p>
          <div class="app-landing__price">
            <span class="app-landing__price-value">0€</span>
          </div>
          <p class="app-page-copy">
            Per provare il loop base e vedere come cambia il tuo disponibile reale.
          </p>
          <div class="app-landing__feature-list">
            <p class="app-landing__feature">Onboarding base</p>
            <p class="app-landing__feature">Preview del dashboard</p>
            <p class="app-landing__feature">Storico limitato</p>
          </div>
          <UButton to="/pricing" variant="soft" color="neutral" class="ui-action-button">
            Vedi dettaglio piani
          </UButton>
        </SurfaceCard>

        <SurfaceCard padding="lg" class="app-landing__price-card app-landing__price-card--featured">
          <p class="label-xs">Core Clarity</p>
          <div class="app-landing__price">
            <span class="app-landing__price-value">49€</span>
            <span class="app-landing__price-period">/ anno</span>
          </div>
          <p class="app-page-copy">
            Il piano consigliato per leggere il mese, le scadenze e il denaro davvero disponibile.
          </p>
          <div class="app-landing__feature-list">
            <p class="app-landing__feature">Loop mensile completo</p>
            <p class="app-landing__feature">Scadenze e spiegazioni</p>
            <p class="app-landing__feature">Storico completo</p>
          </div>
          <UButton to="/pricing" color="primary" class="ui-action-button">
            Scegli Core
          </UButton>
        </SurfaceCard>

        <SurfaceCard padding="lg" class="app-landing__price-card">
          <p class="label-xs">Planning & Scenarios</p>
          <div class="app-landing__price">
            <span class="app-landing__price-value">79€</span>
            <span class="app-landing__price-period">/ anno</span>
          </div>
          <p class="app-page-copy">
            Per chi vuole confrontare scenari, esportare i dati e leggere l'anno con più profondità.
          </p>
          <div class="app-landing__feature-list">
            <p class="app-landing__feature">Scenario comparison</p>
            <p class="app-landing__feature">Export per commercialista</p>
            <p class="app-landing__feature">Planning annuale avanzato</p>
          </div>
          <UButton to="/pricing" variant="soft" color="neutral" class="ui-action-button">
            Vai al piano alto
          </UButton>
        </SurfaceCard>
      </div>
    </section>

    <section class="app-landing__section fade-up fade-up-2">
      <div>
        <p class="app-landing__eyebrow">Fiducia</p>
        <h2 class="app-landing__section-title">La chiarezza vale solo se il calcolo si può spiegare.</h2>
        <p class="app-landing__section-copy">
          La promessa di Chiaro è semplice: il numero principale è sempre il disponibile reale, e
          ogni stima importante deve poter dire perché esiste.
        </p>
      </div>

      <div class="app-grid-2">
        <SurfaceCard padding="lg">
          <p class="label-xs">Ruleset</p>
          <p class="app-page-copy mt-3">
            Le regole fiscali sono trattate come parte del prodotto, non come un dettaglio nascosto.
          </p>
        </SurfaceCard>

        <SurfaceCard padding="lg">
          <p class="label-xs">Spiegazioni</p>
          <p class="app-page-copy mt-3">
            Il calcolo si legge in italiano, con assunzioni esplicite e senza gergo da consulente.
          </p>
        </SurfaceCard>
      </div>
    </section>

    <section class="app-landing__section fade-up fade-up-2">
      <div>
        <p class="app-landing__eyebrow">FAQ</p>
        <h2 class="app-landing__section-title">Le domande che contano prima di iniziare.</h2>
      </div>

      <div class="app-landing__faq">
        <details class="app-landing__faq-item">
          <summary class="app-landing__faq-question">Chiaro sostituisce il commercialista?</summary>
          <p class="app-landing__faq-answer">
            No. Chiaro non vuole fare contabilità completa: vuole dirti ogni mese quanto puoi usare
            davvero.
          </p>
        </details>

        <details class="app-landing__faq-item">
          <summary class="app-landing__faq-question">A chi serve di più?</summary>
          <p class="app-landing__faq-answer">
            A freelance e knowledge worker in forfettario con reddito variabile e poca voglia di
            fare conti a mano.
          </p>
        </details>

        <details class="app-landing__faq-item">
          <summary class="app-landing__faq-question">È pensato solo per il web?</summary>
          <p class="app-landing__faq-answer">
            Sì. Il prodotto è web-first e costruito per il controllo mensile, non per essere
            disperso su troppi canali.
          </p>
        </details>

        <details class="app-landing__faq-item">
          <summary class="app-landing__faq-question">Posso provarlo prima di pagare?</summary>
          <p class="app-landing__faq-answer">
            Sì. Il percorso parte dal free layer e ti porta al valore prima di chiederti di
            comprare il piano giusto.
          </p>
        </details>
      </div>
    </section>

    <section class="app-landing__section fade-up fade-up-2">
      <SurfaceCard variant="gradient" padding="lg">
        <div class="app-grid-2">
          <div>
            <p class="app-landing__eyebrow">Pronto per il controllo mensile</p>
            <h2 class="app-landing__section-title mt-3">Hai bisogno di una lettura chiara, non di più rumore.</h2>
          </div>

          <div class="app-landing__actions md:justify-end md:items-start md:pt-1">
            <UButton to="/login" size="lg" color="primary" class="ui-action-button">
              Entra con Google
            </UButton>
            <UButton to="/pricing" size="lg" variant="soft" color="neutral" class="ui-action-button">
              Vedi prezzi
            </UButton>
          </div>
        </div>
      </SurfaceCard>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Chiaro',
  meta: [
    {
      name: 'description',
      content: 'Chiaro è il product di chiarezza per freelance in forfettario: ti dice quanto hai incassato, quanto accantonare e quanto puoi usare davvero.',
    },
  ],
})
</script>
