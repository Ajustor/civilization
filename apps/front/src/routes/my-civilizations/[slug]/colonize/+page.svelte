<script lang="ts">
  import type { PageData, ActionData } from './$types'
  import { enhance } from '$app/forms'
  import { techNames, resourceNames } from '$lib/translations'
  import Breadcrumb from '$lib/components/Breadcrumb.svelte'
  import { toast } from 'svelte-sonner'
  import { goto } from '$app/navigation'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const civ = $derived(data.civilization)
  const totalPeople = $derived(civ.citizensCount ?? 0)

  let colonyName = $state('')
  let populationPercent = $state(20)
  let resourcePercents = $state<Record<string, number>>(
    Object.fromEntries((civ.resources ?? []).map((r) => [r.type, 0])),
  )
  let selectedTechs = $state<string[]>([])

  const POP_PRESETS = [5, 10, 20, 30, 50]
  const RES_PRESETS = [0, 10, 25, 50]

  const transferCount = $derived(Math.floor((totalPeople * populationPercent) / 100))
  const remainingCount = $derived(totalPeople - transferCount)
  const popValid = $derived(remainingCount >= 10 && transferCount >= 1)
  const canSubmit = $derived(colonyName.trim().length >= 3 && popValid)

  const resourcesPayload = $derived(
    (civ.resources ?? [])
      .filter((r) => (resourcePercents[r.type] ?? 0) > 0)
      .map((r) => ({
        type: r.type,
        amount: Math.floor((r.quantity * (resourcePercents[r.type] ?? 0)) / 100),
      })),
  )

  const toggleTech = (id: string) => {
    selectedTechs = selectedTechs.includes(id)
      ? selectedTechs.filter((t) => t !== id)
      : [...selectedTechs, id]
  }

  const selectAllTechs = () => {
    selectedTechs = [...(civ.researchedTechs ?? [])]
  }

  const clearTechs = () => {
    selectedTechs = []
  }
</script>

<svelte:head>
  <title>Fonder une colonie — {civ.name}</title>
</svelte:head>

<div class="civ-page-wrapper">
  <Breadcrumb
    items={[
      { label: 'Mes civilisations', href: '/my-civilizations' },
      { label: civ.name, href: `/my-civilizations/${civ.id}` },
      { label: 'Fonder une colonie' },
    ]}
  />

  {#if form?.error}
    <p class="form-error">{form.error}</p>
  {/if}

  <form
    method="POST"
    action="?/colonize"
    use:enhance={() => ({
      onResult({ result }) {
        if (result.type === 'redirect') {
          toast.success('Colonie fondée avec succès !')
          goto(result.location)
        } else if (result.type === 'failure') {
          toast.error(
            (result.data as { error?: string })?.error ?? 'Une erreur est survenue',
          )
        }
      },
    })}
    class="colonize-form"
  >
    <input type="hidden" name="resources" value={JSON.stringify(resourcesPayload)} />
    <input type="hidden" name="techs" value={JSON.stringify(selectedTechs)} />

    <!-- Colony name -->
    <section class="form-section">
      <h2>Nom de la colonie</h2>
      <input
        type="text"
        name="colonyName"
        bind:value={colonyName}
        minlength="3"
        required
        placeholder="Ex. : Nova Carthago"
        class="text-input"
      />
    </section>

    <!-- Population -->
    <section class="form-section">
      <h2>Population</h2>
      <div class="pop-summary">
        <div class="pop-stat">
          <span class="pop-stat-val">{transferCount}</span>
          <span class="pop-stat-lbl">colons transférés</span>
        </div>
        <div class="pop-divider">→</div>
        <div class="pop-stat">
          <span class="pop-stat-val" class:warn={!popValid && totalPeople > 0}>{remainingCount}</span>
          <span class="pop-stat-lbl">restent dans la mère</span>
        </div>
      </div>
      {#if !popValid && totalPeople > 0}
        <p class="field-warning">La mère doit conserver au moins 10 habitants.</p>
      {/if}
      <div class="preset-row">
        {#each POP_PRESETS as p}
          <button
            type="button"
            class="preset-btn"
            class:active={populationPercent === p}
            onclick={() => (populationPercent = p)}
          >{p}%</button>
        {/each}
      </div>
      <input
        type="range"
        name="populationPercent"
        min="5"
        max="50"
        bind:value={populationPercent}
        class="range-input"
      />
      <div class="range-labels">
        <span>5%</span>
        <span class="range-cur">{populationPercent}%</span>
        <span>50%</span>
      </div>
    </section>

    <!-- Resources -->
    {#if (civ.resources ?? []).length > 0}
      <section class="form-section">
        <h2>Ressources</h2>
        {#each civ.resources ?? [] as resource (resource.type)}
          {@const pct = resourcePercents[resource.type] ?? 0}
          {@const transferAmt = Math.floor((resource.quantity * pct) / 100)}
          <div class="resource-block">
            <div class="resource-header">
              <span class="resource-name">{resourceNames[resource.type] ?? resource.type}</span>
              <span class="resource-stock">{resource.quantity} disponibles</span>
              <span class="resource-transfer" class:active={transferAmt > 0}>
                {#if transferAmt > 0}→ {transferAmt} transférés{:else}aucun transfert{/if}
              </span>
            </div>
            <div class="preset-row">
              {#each RES_PRESETS as p}
                <button
                  type="button"
                  class="preset-btn"
                  class:active={pct === p}
                  onclick={() => (resourcePercents[resource.type] = p)}
                >{p}%</button>
              {/each}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              bind:value={resourcePercents[resource.type]}
              class="range-input"
            />
          </div>
        {/each}
      </section>
    {/if}

    <!-- Technologies -->
    {#if (civ.researchedTechs ?? []).length > 0}
      <section class="form-section">
        <h2>Technologies à transmettre</h2>
        <p class="section-hint">La mère conserve toutes ses recherches.</p>
        <div class="tech-actions">
          <button type="button" class="tech-action-btn" onclick={selectAllTechs}>Tout sélectionner</button>
          <button type="button" class="tech-action-btn" onclick={clearTechs}>Tout effacer</button>
          <span class="tech-count">{selectedTechs.length} / {(civ.researchedTechs ?? []).length}</span>
        </div>
        <div class="tech-grid">
          {#each civ.researchedTechs ?? [] as techId (techId)}
            <button
              type="button"
              class="tech-chip"
              class:selected={selectedTechs.includes(techId)}
              onclick={() => toggleTech(techId)}
            >
              {#if selectedTechs.includes(techId)}<span class="chip-check">✓</span>{/if}
              {techNames[techId] ?? techId}
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Submit -->
    <button type="submit" disabled={!canSubmit} class="submit-btn" class:enabled={canSubmit}>
      🌍 Fonder la colonie
    </button>
  </form>
</div>

<style>
  .form-error {
    font-family: 'EB Garamond', serif;
    color: oklch(0.5 0.18 25);
    margin: 0 0 16px;
    font-size: 15px;
  }

  .colonize-form {
    display: flex;
    flex-direction: column;
    gap: 28px;
    max-width: 580px;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .form-section h2 {
    font-family: 'Marcellus', serif;
    font-size: 18px;
    margin: 0;
    color: oklch(0.3 0.04 40);
    border-bottom: 1px solid oklch(0.85 0.03 60);
    padding-bottom: 6px;
  }

  .text-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid oklch(0.74 0.05 60);
    border-radius: 5px;
    font-family: 'EB Garamond', serif;
    font-size: 16px;
    background: oklch(0.985 0.01 84);
    color: oklch(0.25 0.03 40);
    box-sizing: border-box;
  }

  .text-input:focus {
    outline: none;
    border-color: oklch(0.55 0.1 140);
    box-shadow: 0 0 0 2px oklch(0.55 0.1 140 / 0.2);
  }

  /* Population summary */
  .pop-summary {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 16px;
    background: oklch(0.96 0.015 84);
    border: 1px solid oklch(0.85 0.03 60);
    border-radius: 6px;
  }

  .pop-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex: 1;
  }

  .pop-stat-val {
    font-family: 'Marcellus', serif;
    font-size: 26px;
    color: oklch(0.35 0.08 140);
    line-height: 1;
  }

  .pop-stat-val.warn {
    color: oklch(0.5 0.18 25);
  }

  .pop-stat-lbl {
    font-family: 'EB Garamond', serif;
    font-size: 12px;
    color: oklch(0.5 0.04 50);
    text-align: center;
  }

  .pop-divider {
    font-size: 22px;
    color: oklch(0.65 0.05 60);
    flex-shrink: 0;
  }

  .field-warning {
    margin: 0;
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: oklch(0.5 0.18 25);
  }

  /* Presets */
  .preset-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .preset-btn {
    padding: 5px 14px;
    border: 1px solid oklch(0.8 0.04 60);
    border-radius: 999px;
    background: oklch(0.985 0.01 84);
    font-family: 'Marcellus', serif;
    font-size: 13px;
    color: oklch(0.45 0.05 50);
    cursor: pointer;
    transition: background 0.1s ease, border-color 0.1s ease, color 0.1s ease;
  }

  .preset-btn:hover {
    border-color: oklch(0.55 0.1 140);
    color: oklch(0.35 0.1 140);
  }

  .preset-btn.active {
    background: oklch(0.45 0.12 140);
    border-color: oklch(0.45 0.12 140);
    color: oklch(0.97 0.01 84);
  }

  .range-input {
    width: 100%;
    accent-color: oklch(0.48 0.12 140);
    cursor: pointer;
  }

  .range-labels {
    display: flex;
    justify-content: space-between;
    font-family: 'EB Garamond', serif;
    font-size: 12px;
    color: oklch(0.55 0.04 50);
  }

  .range-cur {
    font-family: 'Marcellus', serif;
    color: oklch(0.4 0.1 140);
    font-size: 13px;
  }

  /* Resources */
  .resource-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid oklch(0.87 0.03 60);
    border-radius: 5px;
    background: oklch(0.99 0.008 84);
  }

  .resource-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }

  .resource-name {
    font-family: 'Marcellus', serif;
    font-size: 15px;
    color: oklch(0.32 0.04 40);
    flex: 1;
    min-width: 100px;
  }

  .resource-stock {
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: oklch(0.55 0.04 50);
  }

  .resource-transfer {
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: oklch(0.55 0.04 50);
    font-style: italic;
  }

  .resource-transfer.active {
    color: oklch(0.42 0.12 140);
    font-style: normal;
    font-weight: 600;
  }

  .section-hint {
    margin: 0;
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: oklch(0.5 0.03 50);
    font-style: italic;
  }

  /* Tech actions bar */
  .tech-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tech-action-btn {
    padding: 4px 12px;
    border: 1px solid oklch(0.8 0.04 60);
    border-radius: 4px;
    background: oklch(0.985 0.01 84);
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: oklch(0.45 0.05 50);
    cursor: pointer;
    transition: background 0.1s ease, border-color 0.1s ease;
  }

  .tech-action-btn:hover {
    border-color: oklch(0.6 0.08 50);
    background: oklch(0.96 0.015 84);
  }

  .tech-count {
    margin-left: auto;
    font-family: 'Marcellus', serif;
    font-size: 13px;
    color: oklch(0.5 0.08 140);
  }

  .tech-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .tech-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'EB Garamond', serif;
    font-size: 14px;
    cursor: pointer;
    padding: 5px 12px;
    border: 1px solid oklch(0.8 0.04 60);
    border-radius: 999px;
    background: oklch(0.985 0.01 84);
    color: oklch(0.4 0.04 50);
    transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  }

  .tech-chip:hover {
    border-color: oklch(0.6 0.1 130);
    background: oklch(0.97 0.03 130 / 0.3);
  }

  .tech-chip.selected {
    background: oklch(0.45 0.12 140);
    border-color: oklch(0.45 0.12 140);
    color: oklch(0.97 0.01 84);
  }

  .chip-check {
    font-size: 12px;
    font-weight: 700;
  }

  .submit-btn {
    align-self: flex-start;
    padding: 11px 28px;
    background: oklch(0.75 0.02 50);
    color: oklch(0.96 0.01 84);
    border: none;
    border-radius: 5px;
    font-family: 'Marcellus', serif;
    font-size: 16px;
    cursor: not-allowed;
    transition: background 0.15s ease, transform 0.1s ease;
  }

  .submit-btn.enabled {
    background: oklch(0.45 0.1 140);
    cursor: pointer;
  }

  .submit-btn.enabled:hover {
    background: oklch(0.4 0.12 140);
    transform: translateY(-1px);
  }
</style>
