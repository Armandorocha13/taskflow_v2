package br.com.kanban.controle;

import br.com.kanban.entidade.Membro;
import br.com.kanban.entidade.Prioridade;
import br.com.kanban.entidade.Tarefa;
import br.com.kanban.servico.MembroServico;
import br.com.kanban.servico.TarefaServico;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Controller
@RequestMapping("/admin")
public class AdminControle {

    private final TarefaServico tarefaServico;
    private final MembroServico membroServico;

    public AdminControle(TarefaServico tarefaServico, MembroServico membroServico) {
        this.tarefaServico = tarefaServico;
        this.membroServico = membroServico;
    }

    private boolean isAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute("perfil"));
    }

    @ModelAttribute
    public void addAttributes(Model model, HttpSession session) {
        String login = (String) session.getAttribute("usuarioLogado");
        if (login != null) {
            if ("tiagoffa".equals(login)) {
                Membro m = new Membro();
                m.setNome("Tiago Admin");
                m.setUsuario("tiagoffa");
                model.addAttribute("usuarioLogado", m);
            } else {
                membroServico.buscarPorUsuario(login).ifPresent(m -> {
                    model.addAttribute("usuarioLogado", m);
                });
            }
        }
    }

    @GetMapping("/tarefas")
    public String tarefas(Model model, HttpSession session) {
        if (!isAdmin(session))
            return "redirect:/login";
        model.addAttribute("aba", "tarefas");
        model.addAttribute("tarefas", tarefaServico.listarTodas());
        model.addAttribute("membros", membroServico.listarTodos());
        return "admin";
    }

    @PostMapping("/tarefas/nova")
    public String novaTarefa(@RequestParam("titulo") String titulo,
            @RequestParam("descricao") String descricao,
            @RequestParam("membroId") Long membroId,
            @RequestParam("prioridade") String prioridade,
            @RequestParam(value = "prazo", required = false) String prazo,
            HttpSession session) {
        if (!isAdmin(session))
            return "redirect:/login";

        Tarefa tarefaObjeto = new Tarefa();
        tarefaObjeto.setTitulo(titulo);
        tarefaObjeto.setDescricao(descricao);
        tarefaObjeto.setPrioridade(Prioridade.valueOf(prioridade));
        if (prazo != null && !prazo.isEmpty())
            tarefaObjeto.setPrazo(LocalDate.parse(prazo));

        for (Membro m : membroServico.listarTodos()) {
            if (m.getId().equals(membroId)) {
                tarefaObjeto.setMembro(m);
                break;
            }
        }

        tarefaServico.salvarTarefa(tarefaObjeto);
        return "redirect:/admin/tarefas";

    }

    @PostMapping("/tarefas/alternar/{id}")
    public String alternarTarefa(@PathVariable("id") Long id, HttpSession session) {
        if (!isAdmin(session))
            return "redirect:/login";
        tarefaServico.alternarStatus(id);
        return "redirect:/admin/tarefas";
    }

    @PostMapping("/tarefas/excluir/{id}")
    public String excluirTarefa(@PathVariable("id") Long id, HttpSession session) {
        if (!isAdmin(session))
            return "redirect:/login";
        tarefaServico.excluir(id);
        return "redirect:/admin/tarefas";
    }

    @GetMapping("/equipe")
    public String equipe(Model model, HttpSession session) {
        if (!isAdmin(session))
            return "redirect:/login";
            
        java.util.List<Membro> membrosList = membroServico.listarTodos();
        java.util.Map<Long, Long> tarefasPorMembro = new java.util.HashMap<>();
        
        for(Membro m: membrosList) {
            long count = tarefaServico.listarPorMembro(m).size();
            tarefasPorMembro.put(m.getId(), count);
        }
        
        model.addAttribute("aba", "equipe");
        model.addAttribute("membros", membrosList);
        model.addAttribute("tarefasCount", tarefasPorMembro);
        return "admin";
    }

    @PostMapping("/equipe/novo")
    public String novoMembro(Membro membro, HttpSession session) {
        if (!isAdmin(session))
            return "redirect:/login";
        
        // Garante que o telefone comece com 55
        if (membro.getTelefone() != null && !membro.getTelefone().startsWith("55")) {
            membro.setTelefone("55" + membro.getTelefone());
        }
        
        membroServico.salvar(membro);
        return "redirect:/admin/equipe";
    }

    @PostMapping("/equipe/excluir/{id}")
    public String excluirMembro(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session))
            return "redirect:/login";
        membroServico.excluir(id);
        return "redirect:/admin/equipe";
    }

    @GetMapping("/whatsapp")
    public String whatsapp(Model model, HttpSession session) {
        if (!isAdmin(session))
            return "redirect:/login";
        model.addAttribute("aba", "whatsapp");
        return "admin";
    }
}
